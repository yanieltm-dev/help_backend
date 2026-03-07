import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import type { Authenticator } from '../ports/authenticator.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import {
  InvalidOtpError,
  ExpiredOtpError,
  MaxAttemptsExceededError,
} from '../../domain/errors/otp.errors';
import { Session } from '../../domain/entities/session.entity';

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
    name: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
  };
}

export type VerifyEmailUseCaseConfig = {
  sessionExpiresInMs: number;
};

export class VerifyEmailUseCase {
  private readonly MAX_ATTEMPTS = 5;

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
        user: {
          id: user.id,
          name: user.name,
          email: user.email.value,
          image: profile?.avatarUrl ?? null,
          emailVerified: true,
        },
      };
    }

    const verification = await this.verificationRepo.findByIdentifierAndType(
      email,
      'email_verification',
    );

    if (!verification) {
      throw new InvalidOtpError();
    }

    if (verification.isExpired()) {
      throw new ExpiredOtpError();
    }

    if (verification.hasExceededMaxAttempts(this.MAX_ATTEMPTS)) {
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email.value,
        image: profile?.avatarUrl ?? null,
        emailVerified: true,
      },
    };
  }
}
