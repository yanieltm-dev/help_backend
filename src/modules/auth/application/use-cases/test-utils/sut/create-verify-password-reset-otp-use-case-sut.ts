import { VerifyPasswordResetOtpUseCase } from '@/modules/auth/application/use-cases/verify-password-reset-otp.use-case';
import { parseDuration } from '@/shared/utils/parse-duration';

import type { VerificationRepository } from '@/modules/auth/domain/ports/verification.repository.port';
import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';

type CreateVerifyPasswordResetOtpUseCaseSutOverrides = Partial<
  Readonly<{
    verificationRepo: jest.Mocked<VerificationRepository>;
    hasher: jest.Mocked<PasswordHasher>;
    idGenerator: jest.Mocked<IIdGenerator>;
  }>
>;

type VerifyPasswordResetOtpUseCaseSut = Readonly<{
  useCase: VerifyPasswordResetOtpUseCase;
  verificationRepo: jest.Mocked<VerificationRepository>;
  hasher: jest.Mocked<PasswordHasher>;
  idGenerator: jest.Mocked<IIdGenerator>;
}>;

export function createVerifyPasswordResetOtpUseCaseSut(
  overrides: CreateVerifyPasswordResetOtpUseCaseSutOverrides = {},
): VerifyPasswordResetOtpUseCaseSut {
  const defaultVerificationRepo: jest.Mocked<VerificationRepository> =
    AuthUseCaseTestKit.createVerificationRepositoryMock();
  const defaultHasher: jest.Mocked<PasswordHasher> =
    AuthUseCaseTestKit.createPasswordHasherMock();
  const defaultIdGenerator: jest.Mocked<IIdGenerator> =
    AuthUseCaseTestKit.createIdGeneratorMock();

  const resolvedVerificationRepo: jest.Mocked<VerificationRepository> =
    overrides.verificationRepo ?? defaultVerificationRepo;
  const resolvedHasher: jest.Mocked<PasswordHasher> =
    overrides.hasher ?? defaultHasher;
  const resolvedIdGenerator: jest.Mocked<IIdGenerator> =
    overrides.idGenerator ?? defaultIdGenerator;

  resolvedIdGenerator.generate
    .mockReturnValueOnce('change-token-id')
    .mockReturnValueOnce('change-token-secret');
  resolvedHasher.hash.mockResolvedValue('hashed-secret');

  return {
    useCase: new VerifyPasswordResetOtpUseCase(
      resolvedVerificationRepo,
      resolvedHasher,
      resolvedIdGenerator,
      { changePasswordTokenExpiresInMs: parseDuration('15m') },
    ),
    verificationRepo: resolvedVerificationRepo,
    hasher: resolvedHasher,
    idGenerator: resolvedIdGenerator,
  };
}
