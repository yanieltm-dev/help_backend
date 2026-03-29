import type { ProfileRepository } from '@/modules/users/domain/ports/profile.repository.port';
import type { UserRepository } from '@/modules/users/domain/ports/user.repository.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { Session } from '../../domain/entities/session.entity';
import { VerificationTokenType } from '../../domain/entities/verification-token.entity';
import {
  ExpiredOtpError,
  InvalidOtpError,
  MaxAttemptsExceededError,
} from '../../domain/errors/otp.errors';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import { buildAuthUserResponse } from '../mappers/auth-user.mapper';
import type { Authenticator } from '../ports/authenticator.port';
import type { PasswordHasher } from '../ports/password-hasher.port';

export interface VerifyEmailCommand {
  email: string;
  code: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface VerifyEmailResponse {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  user: {
    id: string;
    userName: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    emailVerified: boolean;
  };
}

export type VerifyEmailUseCaseConfig = {
  sessionExpiresInMs: number;
  otpMaxAttempts: number;
};

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly verificationRepo: VerificationRepository,
    private readonly hasher: PasswordHasher,
    private readonly uow: IUnitOfWork,
    private readonly authenticator: Authenticator,
    private readonly sessionRepo: SessionRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly config: VerifyEmailUseCaseConfig,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResponse> {
    const { email, code, ipAddress, userAgent } = command;

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new InvalidOtpError();
    }

    if (user.emailVerified) {
      const { accessToken, refreshToken, accessTokenExpiresAt } =
        await this.authenticator.generateTokens({
          sub: user.id,
          email: user.email.value,
        });
      const session = Session.create(
        this.idGenerator.generate(),
        user.id,
        refreshToken,
        new Date(Date.now() + this.config.sessionExpiresInMs),
        ipAddress,
        userAgent,
      );
      await this.sessionRepo.save(session);
      const profile = await this.profileRepo.findByUserId(user.id);
      return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        user: buildAuthUserResponse(user, profile, true),
      };
    }

    const verification = await this.verificationRepo.findByIdentifierAndType(
      email,
      VerificationTokenType.EMAIL_VERIFICATION,
    );

    if (!verification) {
      throw new InvalidOtpError();
    }

    if (verification.isExpired()) {
      throw new ExpiredOtpError();
    }

    if (verification.hasExceededMaxAttempts(this.config.otpMaxAttempts)) {
      throw new MaxAttemptsExceededError();
    }

    const isValid = await this.hasher.compare(code, verification.token);

    if (!isValid) {
      const updatedVerification = verification.incrementAttempts();
      await this.verificationRepo.save(updatedVerification);
      throw new InvalidOtpError();
    }

    const verifiedUser = user.verifyEmail();

    const { accessToken, refreshToken, accessTokenExpiresAt } =
      await this.authenticator.generateTokens({
        sub: user.id,
        email: user.email.value,
      });
    const session = Session.create(
      this.idGenerator.generate(),
      user.id,
      refreshToken,
      new Date(Date.now() + this.config.sessionExpiresInMs),
      ipAddress,
      userAgent,
    );

    await this.uow.run(async (tx) => {
      await this.userRepo.save(verifiedUser, tx);
      await this.verificationRepo.delete(verification.id);
      await this.sessionRepo.save(session, tx);
    });

    const profile = await this.profileRepo.findByUserId(user.id);
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      user: buildAuthUserResponse(user, profile, true),
    };
  }
}
