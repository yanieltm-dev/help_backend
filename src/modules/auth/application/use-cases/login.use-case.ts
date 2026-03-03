import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  ACCOUNT_REPOSITORY,
  PROFILE_REPOSITORY,
  PASSWORD_HASHER,
  AUTHENTICATOR,
  SESSION_REPOSITORY,
} from '../../auth.tokens';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import type { Authenticator } from '../../domain/ports/authenticator.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { AccountLockedError } from '../../domain/errors/account-locked.error';
import { AccountNotVerifiedError } from '../../domain/errors/account-not-verified.error';
import { Session } from '../../domain/entities/session.entity';
import { generateUuidV7 } from '@/shared/utils/uuid';
import { User } from '../../domain/entities/user.entity';

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
}

@Injectable()
export class LoginUseCase {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ACCOUNT_REPOSITORY) private readonly accountRepo: AccountRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profileRepo: ProfileRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(AUTHENTICATOR) private readonly authenticator: Authenticator,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResponse> {
    const { emailOrUsername, password, ipAddress, userAgent } = command;

    // 1. Find user by email or username
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

    // 2. Find account
    const account = await this.accountRepo.findByUserId(user.id);
    if (!account) {
      throw new InvalidCredentialsError();
    }

    // 3. Check if locked
    if (account.isLocked()) {
      throw new AccountLockedError(account.lockedUntil);
    }

    // 4. Verify password
    const isPasswordValid = await this.hasher.compare(
      password,
      account.password?.value || '',
    );

    if (!isPasswordValid) {
      const updatedAccount = account.recordFailedAttempt(
        this.MAX_FAILED_ATTEMPTS,
        this.LOCKOUT_DURATION_MS,
      );
      await this.accountRepo.save(updatedAccount);
      throw new InvalidCredentialsError();
    }

    // 5. Check if email verified
    if (!user.emailVerified) {
      throw new AccountNotVerifiedError();
    }

    // 6. Generate tokens
    const { accessToken, refreshToken, accessTokenExpiresAt } =
      await this.authenticator.generateTokens({
        sub: user.id,
        email: user.email.value,
      });

    // 7. Register session
    const session = Session.create(
      generateUuidV7(),
      user.id,
      refreshToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days (should come from config)
      ipAddress,
      userAgent,
    );
    await this.sessionRepo.save(session);

    // 8. Reset failed attempts
    await this.accountRepo.save(account.resetFailedAttempts());

    return { accessToken, refreshToken, accessTokenExpiresAt };
  }
}
