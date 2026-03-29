export type LoginUseCaseConfig = {
  maxFailedAttempts: number;
  lockoutDurationMs: number;
  sessionExpiresInMs: number;
};
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { Session } from '../../domain/entities/session.entity';
import { User } from '../../domain/entities/user.entity';
import { AccountLockedError } from '../../domain/errors/account-locked.error';
import { AccountNotVerifiedError } from '../../domain/errors/account-not-verified.error';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import {
  AuthUserResponse,
  buildAuthUserResponse,
} from '../mappers/auth-user.mapper';
import type { Authenticator } from '../ports/authenticator.port';
import type { PasswordHasher } from '../ports/password-hasher.port';

export interface LoginCommand {
  emailOrUsername: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginResponse {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  user: AuthUserResponse;
}

export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly accountRepo: AccountRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly hasher: PasswordHasher,
    private readonly authenticator: Authenticator,
    private readonly sessionRepo: SessionRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly config: LoginUseCaseConfig,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponse> {
    const { emailOrUsername, password, ipAddress, userAgent } = command;

    let user: User | null = null;

    if (emailOrUsername.includes('@')) {
      user = await this.userRepo.findByEmail(emailOrUsername);
    } else {
      const profile = await this.profileRepo.findByUsername(emailOrUsername);
      if (profile) {
        user = await this.userRepo.findById(profile.userId);
      }
    }

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const account = await this.accountRepo.findByUserId(user.id);
    if (!account) {
      throw new InvalidCredentialsError();
    }

    if (account.isLocked()) {
      throw new AccountLockedError(account.lockedUntil);
    }

    const isPasswordValid = await this.hasher.compare(
      password,
      account.password?.value || '',
    );

    if (!isPasswordValid) {
      const updatedAccount = account.recordFailedAttempt(
        this.config.maxFailedAttempts,
        this.config.lockoutDurationMs,
      );
      await this.accountRepo.save(updatedAccount);
      throw new InvalidCredentialsError();
    }

    if (!user.emailVerified) {
      throw new AccountNotVerifiedError();
    }

    const { accessToken, refreshToken, accessTokenExpiresAt } =
      await this.authenticator.generateTokens({
        sub: user.id,
        email: user.email.value,
      });

    const sessionExpiresInMs = this.config.sessionExpiresInMs;
    const session = Session.create(
      this.idGenerator.generate(),
      user.id,
      refreshToken,
      new Date(Date.now() + sessionExpiresInMs),
      ipAddress,
      userAgent,
    );

    await this.unitOfWork.run(async (tx) => {
      await this.sessionRepo.save(session, tx);
      await this.accountRepo.save(account.resetFailedAttempts(), tx);
    });

    const profile = await this.profileRepo.findByUserId(user.id);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      user: buildAuthUserResponse(user, profile),
    };
  }
}
