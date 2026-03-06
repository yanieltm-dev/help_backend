import { LoginUseCase } from './login.use-case';

import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { AccountNotVerifiedError } from '../../domain/errors/account-not-verified.error';
import { User } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { Authenticator } from '../ports/authenticator.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import { Account } from '../../domain/entities/account.entity';
import { Password } from '../../domain/value-objects/password.vo';
import { Profile } from '../../domain/entities/profile.entity';

jest.mock('@/shared/utils/uuid', () => ({
  generateUuidV7: jest.fn(() => '00000000-0000-0000-0000-000000000000'),
}));

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let accountRepo: jest.Mocked<AccountRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let authenticator: jest.Mocked<Authenticator>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let idGenerator: { generate: jest.Mock };

  beforeEach(() => {
    userRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    accountRepo = {
      findByUserId: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<AccountRepository>;
    profileRepo = {
      findByUsername: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ProfileRepository>;
    hasher = {
      compare: jest.fn(),
      hash: jest.fn(),
    } as unknown as jest.Mocked<PasswordHasher>;
    authenticator = {
      generateTokens: jest.fn(),
      verifyToken: jest.fn(),
    } as unknown as jest.Mocked<Authenticator>;
    sessionRepo = {
      save: jest.fn(),
      findByToken: jest.fn(),
      deleteByToken: jest.fn(),
      deleteByUserId: jest.fn(),
    } as unknown as jest.Mocked<SessionRepository>;
    idGenerator = {
      generate: jest.fn().mockReturnValue('mocked-uuid'),
    };

    useCase = new LoginUseCase(
      userRepo,
      accountRepo,
      profileRepo,
      hasher,
      authenticator,
      sessionRepo,
      idGenerator,
      {
        maxFailedAttempts: 5,
        lockoutDurationMs: 900000,
        sessionExpiresInMs: 3600000,
      },
    );
  });

  it('should return tokens and expiration date on successful login', async () => {
    const emailStr = 'test@example.com';
    const passwordStr = 'password';
    const userId = '00000000-0000-0000-0000-000000000000';
    const user = User.create(userId, emailStr, 'Test User', true);

    const profile = Profile.create(
      'profile-id',
      userId,
      'testuser',
      'Test User',
      'https://example.com/avatar.png',
      new Date('2000-01-01'),
    );

    const account = new Account(
      'account-id',
      userId,
      'credentials',
      emailStr,
      Password.createRaw('Password123!'),
    );

    userRepo.findByEmail.mockResolvedValue(user);
    accountRepo.findByUserId.mockResolvedValue(account);
    profileRepo.findByUserId.mockResolvedValue(profile);
    hasher.compare.mockResolvedValue(true);

    const tokenExp = new Date();
    authenticator.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      accessTokenExpiresAt: tokenExp,
      refreshToken: 'refresh-token',
    });

    const result = await useCase.execute({
      emailOrUsername: emailStr,
      password: passwordStr,
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      accessTokenExpiresAt: tokenExp,
      refreshToken: 'refresh-token',
      user: {
        id: userId,
        name: 'Test User',
        email: emailStr,
        image: 'https://example.com/avatar.png',
        emailVerified: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authenticator.generateTokens).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email.value,
    });
  });

  it('should throw InvalidCredentialsError if user not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);
    await expect(
      useCase.execute({ emailOrUsername: 'none@test.com', password: 'pw' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw AccountNotVerifiedError if email not verified', async () => {
    const userId = '00000000-0000-0000-0000-000000000000';
    const emailStr = 'test@test.com';
    const user = User.create(userId, emailStr, 'Test User', false);
    const account = new Account(
      'account-id',
      userId,
      'credentials',
      emailStr,
      Password.createRaw('Password123!'),
    );
    userRepo.findByEmail.mockResolvedValue(user);
    accountRepo.findByUserId.mockResolvedValue(account);
    hasher.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ emailOrUsername: emailStr, password: 'pw' }),
    ).rejects.toThrow(AccountNotVerifiedError);
  });
});
