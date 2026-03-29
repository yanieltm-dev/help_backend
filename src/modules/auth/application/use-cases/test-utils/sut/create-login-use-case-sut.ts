import { LoginUseCase } from '@/modules/auth/application/use-cases/login.use-case';
import { parseDuration } from '@/shared/utils/parse-duration';

import type { Authenticator } from '@/modules/auth/application/ports/authenticator.port';
import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.port';
import type { AccountRepository } from '@/modules/auth/domain/ports/account.repository.port';
import type { ProfileRepository } from '@/modules/auth/domain/ports/profile.repository.port';
import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';
import type { UserRepository } from '@/modules/auth/domain/ports/user.repository.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';

type IdGeneratorMock = Readonly<{ generate: jest.Mock }>;

type CreateLoginUseCaseSutOverrides = Partial<
  Readonly<{
    userRepo: jest.Mocked<UserRepository>;
    accountRepo: jest.Mocked<AccountRepository>;
    profileRepo: jest.Mocked<ProfileRepository>;
    hasher: jest.Mocked<PasswordHasher>;
    authenticator: jest.Mocked<Authenticator>;
    sessionRepo: jest.Mocked<SessionRepository>;
    idGenerator: IdGeneratorMock;
    uow: jest.Mocked<IUnitOfWork>;
  }>
>;

type LoginUseCaseSut = Readonly<{
  useCase: LoginUseCase;
  userRepo: jest.Mocked<UserRepository>;
  accountRepo: jest.Mocked<AccountRepository>;
  profileRepo: jest.Mocked<ProfileRepository>;
  hasher: jest.Mocked<PasswordHasher>;
  authenticator: jest.Mocked<Authenticator>;
}>;

export function createLoginUseCaseSut(
  overrides: CreateLoginUseCaseSutOverrides = {},
): LoginUseCaseSut {
  const defaultUserRepo: jest.Mocked<UserRepository> =
    AuthUseCaseTestKit.createUserRepositoryMock();
  const defaultAccountRepo: jest.Mocked<AccountRepository> =
    AuthUseCaseTestKit.createAccountRepositoryMock();
  const defaultProfileRepo: jest.Mocked<ProfileRepository> =
    AuthUseCaseTestKit.createProfileRepositoryMock();
  const defaultHasher: jest.Mocked<PasswordHasher> =
    AuthUseCaseTestKit.createPasswordHasherMock();
  const defaultAuthenticator: jest.Mocked<Authenticator> =
    AuthUseCaseTestKit.createAuthenticatorMock();
  const defaultSessionRepo: jest.Mocked<SessionRepository> =
    AuthUseCaseTestKit.createSessionRepositoryMock();
  const defaultIdGenerator: IdGeneratorMock = {
    generate: jest.fn().mockReturnValue('mocked-uuid'),
  };
  const defaultUow: jest.Mocked<IUnitOfWork> =
    AuthUseCaseTestKit.createUnitOfWorkMock();
  const resolvedUserRepo: jest.Mocked<UserRepository> =
    overrides.userRepo ?? defaultUserRepo;
  const resolvedAccountRepo: jest.Mocked<AccountRepository> =
    overrides.accountRepo ?? defaultAccountRepo;
  const resolvedProfileRepo: jest.Mocked<ProfileRepository> =
    overrides.profileRepo ?? defaultProfileRepo;
  const resolvedHasher: jest.Mocked<PasswordHasher> =
    overrides.hasher ?? defaultHasher;
  const resolvedAuthenticator: jest.Mocked<Authenticator> =
    overrides.authenticator ?? defaultAuthenticator;
  const resolvedSessionRepo: jest.Mocked<SessionRepository> =
    overrides.sessionRepo ?? defaultSessionRepo;
  const resolvedIdGenerator: IdGeneratorMock =
    overrides.idGenerator ?? defaultIdGenerator;
  const resolvedUow: jest.Mocked<IUnitOfWork> = overrides.uow ?? defaultUow;
  return {
    useCase: new LoginUseCase(
      resolvedUserRepo,
      resolvedAccountRepo,
      resolvedProfileRepo,
      resolvedHasher,
      resolvedAuthenticator,
      resolvedSessionRepo,
      resolvedIdGenerator,
      {
        maxFailedAttempts: 5,
        lockoutDurationMs: parseDuration('15m'),
        sessionExpiresInMs: parseDuration('1h'),
      },
      resolvedUow,
    ),
    userRepo: resolvedUserRepo,
    accountRepo: resolvedAccountRepo,
    profileRepo: resolvedProfileRepo,
    hasher: resolvedHasher,
    authenticator: resolvedAuthenticator,
  };
}
