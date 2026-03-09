import { ResetPasswordUseCase } from './reset-password.use-case';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { VerificationToken } from '../../domain/entities/verification-token.entity';
import {
  ExpiredOtpError,
  InvalidOtpError,
  MaxAttemptsExceededError,
} from '../../domain/errors/otp.errors';
import { AuthEntitiesTestFactory } from './test-utils/auth-entities-test-factory';
import { createResetPasswordUseCaseSut } from './test-utils/sut/create-reset-password-use-case-sut';
import { parseDuration } from '@/shared/utils/parse-duration';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let accountRepo: jest.Mocked<AccountRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let hasher: jest.Mocked<PasswordHasher>;

  beforeEach(() => {
    const sut = createResetPasswordUseCaseSut();
    useCase = sut.useCase;
    verificationRepo = sut.verificationRepo;
    userRepo = sut.userRepo;
    accountRepo = sut.accountRepo;
    sessionRepo = sut.sessionRepo;
    hasher = sut.hasher;
  });

  it('resets password when OTP is valid', async () => {
    const email = 'user@example.com';
    const verification = AuthEntitiesTestFactory.createVerificationToken({
      id: 'verif-id',
      identifier: email,
      type: 'password_reset',
      expiresInMs: parseDuration('10m'),
    });
    verificationRepo.findByIdentifierAndType.mockResolvedValue(verification);
    hasher.compare.mockResolvedValue(true);
    const user = AuthEntitiesTestFactory.createUser({
      id: 'user-id',
      email,
      name: 'Alice',
      isEmailVerified: true,
    });
    userRepo.findByEmail.mockResolvedValue(user);
    const account = AuthEntitiesTestFactory.createCredentialsAccount({
      id: 'acc-id',
      userId: 'user-id',
      email,
      passwordHash: 'old-hash',
    });
    accountRepo.findByUserId.mockResolvedValue(account);

    await useCase.execute({
      email,
      code: '123456',
      newPassword: 'new-password-123!',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(accountRepo.save).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.delete).toHaveBeenCalledWith('verif-id');
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessionRepo.deleteByUserId).toHaveBeenCalledWith(
      'user-id',
      expect.anything(),
    );
  });

  it('throws InvalidOtpError when verification not found', async () => {
    verificationRepo.findByIdentifierAndType.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'user@example.com',
        code: '123456',
        newPassword: 'new-password-123!',
      }),
    ).rejects.toThrow(InvalidOtpError);
  });

  it('throws ExpiredOtpError when token is expired', async () => {
    const email = 'user@example.com';
    const verification = new VerificationToken(
      'verif-id',
      email,
      'hashed-otp',
      'password_reset',
      new Date(Date.now() - 1000),
      0,
    );
    verificationRepo.findByIdentifierAndType.mockResolvedValue(verification);

    await expect(
      useCase.execute({
        email,
        code: '123456',
        newPassword: 'new-password-123!',
      }),
    ).rejects.toThrow(ExpiredOtpError);
  });

  it('throws MaxAttemptsExceededError when attempts exceeded', async () => {
    const email = 'user@example.com';
    const verification = new VerificationToken(
      'verif-id',
      email,
      'hashed-otp',
      'password_reset',
      new Date(Date.now() + 100000),
      5,
    );
    verificationRepo.findByIdentifierAndType.mockResolvedValue(verification);

    await expect(
      useCase.execute({
        email,
        code: '123456',
        newPassword: 'new-password-123!',
      }),
    ).rejects.toThrow(MaxAttemptsExceededError);
  });
});
