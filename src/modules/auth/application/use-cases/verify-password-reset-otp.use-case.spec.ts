import { parseDuration } from '@/shared/utils/parse-duration';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import {
  VerificationToken,
  VerificationTokenType,
} from '../../domain/entities/verification-token.entity';
import {
  ExpiredOtpError,
  InvalidOtpError,
  MaxAttemptsExceededError,
} from '../../domain/errors/otp.errors';
import { createVerifyPasswordResetOtpUseCaseSut } from './test-utils/sut/create-verify-password-reset-otp-use-case-sut';
import { VerifyPasswordResetOtpUseCase } from './verify-password-reset-otp.use-case';

describe('VerifyPasswordResetOtpUseCase', () => {
  let useCase: VerifyPasswordResetOtpUseCase;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let idGenerator: jest.Mocked<IIdGenerator>;

  beforeEach(() => {
    const sut = createVerifyPasswordResetOtpUseCaseSut();
    useCase = sut.useCase;
    verificationRepo = sut.verificationRepo;
    hasher = sut.hasher;
    idGenerator = sut.idGenerator;
  });

  it('returns changePasswordToken and creates password_change verification when OTP is valid', async () => {
    const email = 'user@example.com';
    const otpVerification = new VerificationToken(
      'otp-verification-id',
      email,
      'hashed-otp',
      VerificationTokenType.PASSWORD_RESET,
      new Date(Date.now() + parseDuration('10m')),
      0,
    );
    verificationRepo.findByIdentifierAndType.mockResolvedValue(otpVerification);
    hasher.compare.mockResolvedValue(true);

    idGenerator.generate
      .mockReturnValueOnce('change-token-id')
      .mockReturnValueOnce('change-token-secret');
    hasher.hash.mockResolvedValue('hashed-secret');

    const result = await useCase.execute({ email, otp: '123456' });

    expect(result.changePasswordToken).toBe(
      'change-token-id.change-token-secret',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.delete).toHaveBeenCalledWith('otp-verification-id');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'change-token-id',
        identifier: email,
        token: 'hashed-secret',
        type: VerificationTokenType.PASSWORD_CHANGE,
      }),
    );
  });

  it('throws InvalidOtpError when OTP verification not found', async () => {
    verificationRepo.findByIdentifierAndType.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'user@example.com', otp: '123456' }),
    ).rejects.toThrow(InvalidOtpError);
  });

  it('throws ExpiredOtpError when OTP verification is expired', async () => {
    const email = 'user@example.com';
    const otpVerification = new VerificationToken(
      'otp-verification-id',
      email,
      'hashed-otp',
      VerificationTokenType.PASSWORD_RESET,
      new Date(Date.now() - 1000),
      0,
    );
    verificationRepo.findByIdentifierAndType.mockResolvedValue(otpVerification);

    await expect(useCase.execute({ email, otp: '123456' })).rejects.toThrow(
      ExpiredOtpError,
    );
  });

  it('throws MaxAttemptsExceededError when OTP attempts exceeded', async () => {
    const email = 'user@example.com';
    const otpVerification = new VerificationToken(
      'otp-verification-id',
      email,
      'hashed-otp',
      VerificationTokenType.PASSWORD_RESET,
      new Date(Date.now() + 10000),
      5,
    );
    verificationRepo.findByIdentifierAndType.mockResolvedValue(otpVerification);

    await expect(useCase.execute({ email, otp: '123456' })).rejects.toThrow(
      MaxAttemptsExceededError,
    );
  });

  it('increments attempts and throws InvalidOtpError when OTP is invalid', async () => {
    const email = 'user@example.com';
    const otpVerification = new VerificationToken(
      'otp-verification-id',
      email,
      'hashed-otp',
      VerificationTokenType.PASSWORD_RESET,
      new Date(Date.now() + 10000),
      0,
    );
    verificationRepo.findByIdentifierAndType.mockResolvedValue(otpVerification);
    hasher.compare.mockResolvedValue(false);

    await expect(useCase.execute({ email, otp: '123456' })).rejects.toThrow(
      InvalidOtpError,
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'otp-verification-id',
        attempts: 1,
      }),
    );
  });
});
