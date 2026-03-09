import { ResendVerificationUseCase } from '@/modules/auth/application/use-cases/resend-verification.use-case';
import { parseDuration } from '@/shared/utils/parse-duration';

import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.port';
import type { UserRepository } from '@/modules/auth/domain/ports/user.repository.port';
import type { VerificationRepository } from '@/modules/auth/domain/ports/verification.repository.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';

type IdGeneratorMock = Readonly<{ generate: jest.Mock }>;

type CreateResendVerificationUseCaseSutOverrides = Partial<
  Readonly<{
    userRepo: jest.Mocked<UserRepository>;
    verificationRepo: jest.Mocked<VerificationRepository>;
    hasher: jest.Mocked<PasswordHasher>;
    eventBus: jest.Mocked<IEventBus>;
    idGenerator: IdGeneratorMock;
  }>
>;

type ResendVerificationUseCaseSut = Readonly<{
  useCase: ResendVerificationUseCase;
  userRepo: jest.Mocked<UserRepository>;
  verificationRepo: jest.Mocked<VerificationRepository>;
  eventBus: jest.Mocked<IEventBus>;
}>;

export function createResendVerificationUseCaseSut(
  overrides: CreateResendVerificationUseCaseSutOverrides = {},
): ResendVerificationUseCaseSut {
  const defaultUserRepo: jest.Mocked<UserRepository> =
    AuthUseCaseTestKit.createUserRepositoryMock();
  const defaultVerificationRepo: jest.Mocked<VerificationRepository> =
    AuthUseCaseTestKit.createVerificationRepositoryMock();
  const defaultHasher: jest.Mocked<PasswordHasher> =
    AuthUseCaseTestKit.createPasswordHasherMock();
  defaultHasher.hash.mockResolvedValue('hashed_otp');
  const defaultEventBus: jest.Mocked<IEventBus> =
    AuthUseCaseTestKit.createEventBusMock();
  const defaultIdGenerator: IdGeneratorMock = {
    generate: jest.fn().mockReturnValue('mocked-uuid'),
  };
  const resolvedUserRepo: jest.Mocked<UserRepository> =
    overrides.userRepo ?? defaultUserRepo;
  const resolvedVerificationRepo: jest.Mocked<VerificationRepository> =
    overrides.verificationRepo ?? defaultVerificationRepo;
  const resolvedHasher: jest.Mocked<PasswordHasher> =
    overrides.hasher ?? defaultHasher;
  const resolvedEventBus: jest.Mocked<IEventBus> =
    overrides.eventBus ?? defaultEventBus;
  const resolvedIdGenerator: IdGeneratorMock =
    overrides.idGenerator ?? defaultIdGenerator;
  return {
    useCase: new ResendVerificationUseCase(
      resolvedUserRepo,
      resolvedVerificationRepo,
      resolvedHasher,
      resolvedEventBus,
      resolvedIdGenerator,
      {
        otpExpiresInMs: parseDuration('1h'),
        maxRequests: 3,
        windowMs: parseDuration('1h'),
      },
    ),
    userRepo: resolvedUserRepo,
    verificationRepo: resolvedVerificationRepo,
    eventBus: resolvedEventBus,
  };
}
