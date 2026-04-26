import { LoginUseCase } from './login.use-case';

import { Account } from '../../domain/entities/account.entity';
import { AccountNotVerifiedError } from '../../domain/errors/account-not-verified.error';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { ProfileRepository } from '@/modules/users/domain/ports/profile.repository.port';
import type { UserRepository } from '@/modules/users/domain/ports/user.repository.port';
import { Password } from '../../domain/value-objects/password.vo';
import type { Authenticator } from '../ports/authenticator.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { AuthEntitiesTestFactory } from './test-utils/auth-entities-test-factory';
import { createLoginUseCaseSut } from './test-utils/sut/create-login-use-case-sut';

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

  beforeEach(() => {
    const sut = createLoginUseCaseSut();
    useCase = sut.useCase;
    userRepo = sut.userRepo;
    accountRepo = sut.accountRepo;
    profileRepo = sut.profileRepo;
    hasher = sut.hasher;
    authenticator = sut.authenticator;
  });

  it('should return tokens and expiration date on successful login', async () => {
    const emailStr = 'test@example.com';
    const passwordStr = 'password';
    const userId = '00000000-0000-0000-0000-000000000000';
    const user = AuthEntitiesTestFactory.createUser({
      id: userId,
      email: emailStr,
      isEmailVerified: true,
    });
    const profile = AuthEntitiesTestFactory.createProfile({
      userId,
      displayName: 'Test User',
      username: 'testuser',
      avatarUrl: 'https://example.com/avatar.png',
      birthDate: new Date('2000-01-01'),
    });
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
        username: 'testuser',
        displayName: 'Test User',
        email: emailStr,
        avatarUrl: 'https://example.com/avatar.png',
        emailVerified: true,
      },
    });

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
    const user = AuthEntitiesTestFactory.createUser({
      id: userId,
      email: emailStr,
      isEmailVerified: false,
    });
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
