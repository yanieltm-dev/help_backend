import { RequestPasswordResetUseCase } from '@/modules/auth/application/use-cases/request-password-reset.use-case';
import { parseDuration } from '@/shared/utils/parse-duration';

import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';
import type { ProfileRepository } from '@/modules/auth/domain/ports/profile.repository.port';
import type { UserRepository } from '@/modules/auth/domain/ports/user.repository.port';
import type { VerificationRepository } from '@/modules/auth/domain/ports/verification.repository.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';

type CreateRequestPasswordResetUseCaseSutOverrides = Partial<
  Readonly<{
    userRepo: jest.Mocked<UserRepository>;
    profileRepo?: jest.Mocked<ProfileRepository>;
    verificationRepo: jest.Mocked<VerificationRepository>;
    hasher: jest.Mocked<PasswordHasher>;
    eventBus: jest.Mocked<IEventBus>;
    idGenerator: jest.Mocked<IIdGenerator>;
  }>
>;

type RequestPasswordResetUseCaseSut = Readonly<{
  useCase: RequestPasswordResetUseCase;
  userRepo: jest.Mocked<UserRepository>;
  profileRepo: jest.Mocked<ProfileRepository>;
  verificationRepo: jest.Mocked<VerificationRepository>;
  eventBus: jest.Mocked<IEventBus>;
}>;

export function createRequestPasswordResetUseCaseSut(
  overrides: CreateRequestPasswordResetUseCaseSutOverrides = {},
): RequestPasswordResetUseCaseSut {
  const defaultUserRepo: jest.Mocked<UserRepository> =
    AuthUseCaseTestKit.createUserRepositoryMock();
  const defaultProfileRepo: jest.Mocked<ProfileRepository> =
    AuthUseCaseTestKit.createProfileRepositoryMock();
  const defaultVerificationRepo: jest.Mocked<VerificationRepository> =
    AuthUseCaseTestKit.createVerificationRepositoryMock();
  const defaultHasher: jest.Mocked<PasswordHasher> =
    AuthUseCaseTestKit.createPasswordHasherMock();
  defaultHasher.hash.mockResolvedValue('hashed_otp');
  const defaultEventBus: jest.Mocked<IEventBus> =
    AuthUseCaseTestKit.createEventBusMock();
  const defaultIdGenerator: jest.Mocked<IIdGenerator> =
    AuthUseCaseTestKit.createIdGeneratorMock();
  defaultIdGenerator.generate.mockReturnValue('verification-id');
  const resolvedUserRepo: jest.Mocked<UserRepository> =
    overrides.userRepo ?? defaultUserRepo;
  const resolvedProfileRepo: jest.Mocked<ProfileRepository> =
    overrides.profileRepo ?? defaultProfileRepo;
  const resolvedVerificationRepo: jest.Mocked<VerificationRepository> =
    overrides.verificationRepo ?? defaultVerificationRepo;
  const resolvedHasher: jest.Mocked<PasswordHasher> =
    overrides.hasher ?? defaultHasher;
  const resolvedEventBus: jest.Mocked<IEventBus> =
    overrides.eventBus ?? defaultEventBus;
  const resolvedIdGenerator: jest.Mocked<IIdGenerator> =
    overrides.idGenerator ?? defaultIdGenerator;
  return {
    useCase: new RequestPasswordResetUseCase(
      resolvedUserRepo,
      resolvedProfileRepo,
      resolvedVerificationRepo,
      resolvedHasher,
      resolvedEventBus,
      resolvedIdGenerator,
      {
        otpExpiresInMs: parseDuration('10m'),
        maxRequests: 5,
        windowMs: parseDuration('15m'),
      },
    ),
    userRepo: resolvedUserRepo,
    profileRepo: resolvedProfileRepo,
    verificationRepo: resolvedVerificationRepo,
    eventBus: resolvedEventBus,
  };
}
