import { ChangePasswordWithTokenUseCase } from '@/modules/auth/application/use-cases/change-password-with-token.use-case';

import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.port';
import type { AccountRepository } from '@/modules/auth/domain/ports/account.repository.port';
import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';
import type { UserRepository } from '@/modules/users/domain/ports/user.repository.port';
import type { VerificationRepository } from '@/modules/auth/domain/ports/verification.repository.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';

type CreateChangePasswordWithTokenUseCaseSutOverrides = Partial<
  Readonly<{
    verificationRepo: jest.Mocked<VerificationRepository>;
    userRepo: jest.Mocked<UserRepository>;
    accountRepo: jest.Mocked<AccountRepository>;
    sessionRepo: jest.Mocked<SessionRepository>;
    hasher: jest.Mocked<PasswordHasher>;
    uow: jest.Mocked<IUnitOfWork>;
  }>
>;

type ChangePasswordWithTokenUseCaseSut = Readonly<{
  useCase: ChangePasswordWithTokenUseCase;
  verificationRepo: jest.Mocked<VerificationRepository>;
  userRepo: jest.Mocked<UserRepository>;
  accountRepo: jest.Mocked<AccountRepository>;
  sessionRepo: jest.Mocked<SessionRepository>;
  hasher: jest.Mocked<PasswordHasher>;
  uow: jest.Mocked<IUnitOfWork>;
}>;

export function createChangePasswordWithTokenUseCaseSut(
  overrides: CreateChangePasswordWithTokenUseCaseSutOverrides = {},
): ChangePasswordWithTokenUseCaseSut {
  const defaultVerificationRepo: jest.Mocked<VerificationRepository> =
    AuthUseCaseTestKit.createVerificationRepositoryMock();

  const defaultUserRepo: jest.Mocked<UserRepository> =
    AuthUseCaseTestKit.createUserRepositoryMock();
  const defaultAccountRepo: jest.Mocked<AccountRepository> =
    AuthUseCaseTestKit.createAccountRepositoryMock();
  const defaultSessionRepo: jest.Mocked<SessionRepository> =
    AuthUseCaseTestKit.createSessionRepositoryMock();
  const defaultHasher: jest.Mocked<PasswordHasher> =
    AuthUseCaseTestKit.createPasswordHasherMock();
  const defaultUow: jest.Mocked<IUnitOfWork> =
    AuthUseCaseTestKit.createUnitOfWorkMock();

  const resolvedVerificationRepo =
    overrides.verificationRepo ?? defaultVerificationRepo;
  const resolvedUserRepo: jest.Mocked<UserRepository> =
    overrides.userRepo ?? defaultUserRepo;
  const resolvedAccountRepo: jest.Mocked<AccountRepository> =
    overrides.accountRepo ?? defaultAccountRepo;
  const resolvedSessionRepo: jest.Mocked<SessionRepository> =
    overrides.sessionRepo ?? defaultSessionRepo;
  const resolvedHasher: jest.Mocked<PasswordHasher> =
    overrides.hasher ?? defaultHasher;
  const resolvedUow: jest.Mocked<IUnitOfWork> = overrides.uow ?? defaultUow;

  resolvedHasher.hash.mockResolvedValue('hashed-new-password');

  return {
    useCase: new ChangePasswordWithTokenUseCase(
      resolvedVerificationRepo,
      resolvedUserRepo,
      resolvedAccountRepo,
      resolvedSessionRepo,
      resolvedHasher,
      resolvedUow,
    ),
    verificationRepo: resolvedVerificationRepo,
    userRepo: resolvedUserRepo,
    accountRepo: resolvedAccountRepo,
    sessionRepo: resolvedSessionRepo,
    hasher: resolvedHasher,
    uow: resolvedUow,
  };
}
