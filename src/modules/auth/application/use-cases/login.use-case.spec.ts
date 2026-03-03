import { Test, TestingModule } from '@nestjs/testing';
import { LoginUseCase } from './login.use-case';
import {
  USER_REPOSITORY,
  ACCOUNT_REPOSITORY,
  PROFILE_REPOSITORY,
  PASSWORD_HASHER,
  AUTHENTICATOR,
  SESSION_REPOSITORY,
} from '../../auth.tokens';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';
import { AccountNotVerifiedError } from '../../domain/errors/account-not-verified.error';
import { User } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import type { Authenticator } from '../../domain/ports/authenticator.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import { Account } from '../../domain/entities/account.entity';
import { Password } from '../../domain/value-objects/password.vo';

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

  beforeEach(async () => {
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
    } as unknown as jest.Mocked<SessionRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepo },
        { provide: PROFILE_REPOSITORY, useValue: profileRepo },
        { provide: PASSWORD_HASHER, useValue: hasher },
        { provide: AUTHENTICATOR, useValue: authenticator },
        { provide: SESSION_REPOSITORY, useValue: sessionRepo },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);
  });

  it('should return tokens and expiration date on successful login', async () => {
    const emailStr = 'test@example.com';
    const passwordStr = 'password';
    const userId = '00000000-0000-0000-0000-000000000000';
    const user = User.create(userId, emailStr, 'Test User', true);

    const account = new Account(
      'account-id',
      userId,
      'credentials',
      emailStr,
      Password.createRaw('Password123'),
    );

    userRepo.findByEmail.mockResolvedValue(user);
    accountRepo.findByUserId.mockResolvedValue(account);
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
      Password.createRaw('Password123'),
    );
    userRepo.findByEmail.mockResolvedValue(user);
    accountRepo.findByUserId.mockResolvedValue(account);
    hasher.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({ emailOrUsername: emailStr, password: 'pw' }),
    ).rejects.toThrow(AccountNotVerifiedError);
  });
});
