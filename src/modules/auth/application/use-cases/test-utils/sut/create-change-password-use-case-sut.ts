import { ChangePasswordUseCase } from '@/modules/auth/application/use-cases/change-password.use-case';

import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.port';
import type { AccountRepository } from '@/modules/auth/domain/ports/account.repository.port';
import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';

type CreateChangePasswordUseCaseSutOverrides = Partial<
  Readonly<{
    accountRepo: jest.Mocked<AccountRepository>;
    sessionRepo: jest.Mocked<SessionRepository>;
    hasher: jest.Mocked<PasswordHasher>;
    uow: jest.Mocked<IUnitOfWork>;
  }>
>;

type ChangePasswordUseCaseSut = Readonly<{
  useCase: ChangePasswordUseCase;
  accountRepo: jest.Mocked<AccountRepository>;
  sessionRepo: jest.Mocked<SessionRepository>;
  hasher: jest.Mocked<PasswordHasher>;
}>;

export function createChangePasswordUseCaseSut(
  overrides: CreateChangePasswordUseCaseSutOverrides = {},
): ChangePasswordUseCaseSut {
  const defaultAccountRepo: jest.Mocked<AccountRepository> =
    AuthUseCaseTestKit.createAccountRepositoryMock();
  const defaultSessionRepo: jest.Mocked<SessionRepository> =
    AuthUseCaseTestKit.createSessionRepositoryMock();
  const defaultHasher: jest.Mocked<PasswordHasher> =
    AuthUseCaseTestKit.createPasswordHasherMock();
  const defaultUow: jest.Mocked<IUnitOfWork> =
    AuthUseCaseTestKit.createUnitOfWorkMock();
  const resolvedAccountRepo: jest.Mocked<AccountRepository> =
    overrides.accountRepo ?? defaultAccountRepo;
  const resolvedSessionRepo: jest.Mocked<SessionRepository> =
    overrides.sessionRepo ?? defaultSessionRepo;
  const resolvedHasher: jest.Mocked<PasswordHasher> =
    overrides.hasher ?? defaultHasher;
  const resolvedUow: jest.Mocked<IUnitOfWork> = overrides.uow ?? defaultUow;
  return {
    useCase: new ChangePasswordUseCase(
      resolvedAccountRepo,
      resolvedSessionRepo,
      resolvedHasher,
      resolvedUow,
    ),
    accountRepo: resolvedAccountRepo,
    sessionRepo: resolvedSessionRepo,
    hasher: resolvedHasher,
  };
}
