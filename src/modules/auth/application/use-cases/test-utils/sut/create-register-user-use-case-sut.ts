import { RegisterUserUseCase } from '@/modules/auth/application/use-cases/register-user.use-case';

import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.port';
import type { AccountRepository } from '@/modules/auth/domain/ports/account.repository.port';
import type { ProfileRepository } from '@/modules/auth/domain/ports/profile.repository.port';
import type { UserRepository } from '@/modules/auth/domain/ports/user.repository.port';
import type { VerificationRepository } from '@/modules/auth/domain/ports/verification.repository.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';

type CreateRegisterUserUseCaseSutOverrides = Partial<
  Readonly<{
    userRepo: jest.Mocked<UserRepository>;
    accountRepo: jest.Mocked<AccountRepository>;
    profileRepo: jest.Mocked<ProfileRepository>;
    verificationRepo: jest.Mocked<VerificationRepository>;
    hasher: jest.Mocked<PasswordHasher>;
    uow: jest.Mocked<IUnitOfWork>;
    idGenerator: jest.Mocked<IIdGenerator>;
    eventBus: jest.Mocked<IEventBus>;
  }>
>;

type RegisterUserUseCaseSut = Readonly<{
  useCase: RegisterUserUseCase;
  eventBus: jest.Mocked<IEventBus>;
}>;

export function createRegisterUserUseCaseSut(
  overrides: CreateRegisterUserUseCaseSutOverrides = {},
): RegisterUserUseCaseSut {
  const defaultUserRepo: jest.Mocked<UserRepository> =
    AuthUseCaseTestKit.createUserRepositoryMock();
  defaultUserRepo.findByEmail.mockResolvedValue(null);
  const defaultAccountRepo: jest.Mocked<AccountRepository> =
    AuthUseCaseTestKit.createAccountRepositoryMock();
  const defaultProfileRepo: jest.Mocked<ProfileRepository> =
    AuthUseCaseTestKit.createProfileRepositoryMock();
  defaultProfileRepo.findByUsername.mockResolvedValue(null);
  const defaultVerificationRepo: jest.Mocked<VerificationRepository> =
    AuthUseCaseTestKit.createVerificationRepositoryMock();
  const defaultHasher: jest.Mocked<PasswordHasher> =
    AuthUseCaseTestKit.createPasswordHasherMock();
  defaultHasher.hash.mockResolvedValue('hashed');
  const defaultUow: jest.Mocked<IUnitOfWork> =
    AuthUseCaseTestKit.createUnitOfWorkMock();
  const defaultIdGenerator: jest.Mocked<IIdGenerator> =
    AuthUseCaseTestKit.createIdGeneratorMock();
  defaultIdGenerator.generate.mockReturnValue('id-1');
  const defaultEventBus: jest.Mocked<IEventBus> =
    AuthUseCaseTestKit.createEventBusMock();
  const resolvedUserRepo: jest.Mocked<UserRepository> =
    overrides.userRepo ?? defaultUserRepo;
  const resolvedAccountRepo: jest.Mocked<AccountRepository> =
    overrides.accountRepo ?? defaultAccountRepo;
  const resolvedProfileRepo: jest.Mocked<ProfileRepository> =
    overrides.profileRepo ?? defaultProfileRepo;
  const resolvedVerificationRepo: jest.Mocked<VerificationRepository> =
    overrides.verificationRepo ?? defaultVerificationRepo;
  const resolvedHasher: jest.Mocked<PasswordHasher> =
    overrides.hasher ?? defaultHasher;
  const resolvedUow: jest.Mocked<IUnitOfWork> = overrides.uow ?? defaultUow;
  const resolvedIdGenerator: jest.Mocked<IIdGenerator> =
    overrides.idGenerator ?? defaultIdGenerator;
  const resolvedEventBus: jest.Mocked<IEventBus> =
    overrides.eventBus ?? defaultEventBus;
  return {
    useCase: new RegisterUserUseCase(
      resolvedUserRepo,
      resolvedAccountRepo,
      resolvedProfileRepo,
      resolvedVerificationRepo,
      resolvedHasher,
      resolvedUow,
      resolvedIdGenerator,
      resolvedEventBus,
      { otpExpiresInMs: 600000 },
    ),
    eventBus: resolvedEventBus,
  };
}
