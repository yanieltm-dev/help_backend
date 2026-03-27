export type LoginUseCaseConfig = {
  maxFailedAttempts: number;
  lockoutDurationMs: number;
  sessionExpiresInMs: number;
};
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { Authenticator } from '../ports/authenticator.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { AccountLockedError } from '../../domain/errors/account-locked.error';
import { AccountNotVerifiedError } from '../../domain/errors/account-not-verified.error';
import { Session } from '../../domain/entities/session.entity';
import { User } from '../../domain/entities/user.entity';
import { buildAuthUserResponse } from '../mappers/auth-user.mapper';

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
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
  };
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
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponse> {
    const { emailOrUsername, password, ipAddress, userAgent } = command;

    // Find user by email or username
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

    // Find account
    const account = await this.accountRepo.findByUserId(user.id);
    if (!account) {
      throw new InvalidCredentialsError();
    }

    // Check if locked
    if (account.isLocked()) {
      throw new AccountLockedError(account.lockedUntil);
    }

    // Verify password
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

    // Check if email verified
    if (!user.emailVerified) {
      throw new AccountNotVerifiedError();
    }

    // Generate tokens
    const { accessToken, refreshToken, accessTokenExpiresAt } =
      await this.authenticator.generateTokens({
        sub: user.id,
        email: user.email.value,
      });

    // Register session
    const sessionExpiresInMs = this.config.sessionExpiresInMs;
    const session = Session.create(
      this.idGenerator.generate(),
      user.id,
      refreshToken,
      new Date(Date.now() + sessionExpiresInMs),
      ipAddress,
      userAgent,
    );
    await this.sessionRepo.save(session);

    // Reset failed attempts
    await this.accountRepo.save(account.resetFailedAttempts());

    const profile = await this.profileRepo.findByUserId(user.id);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      user: buildAuthUserResponse(user, profile),
    };
  }
}
