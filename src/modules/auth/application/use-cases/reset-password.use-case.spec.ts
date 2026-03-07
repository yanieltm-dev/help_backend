import { ResetPasswordUseCase } from './reset-password.use-case';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { VerificationToken } from '../../domain/entities/verification-token.entity';
import { User } from '../../domain/entities/user.entity';
import { Account } from '../../domain/entities/account.entity';
import {
  ExpiredOtpError,
  InvalidOtpError,
  MaxAttemptsExceededError,
} from '../../domain/errors/otp.errors';
import { Password } from '../../domain/value-objects/password.vo';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let accountRepo: jest.Mocked<AccountRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(() => {
    verificationRepo = {
      findByIdentifierAndType: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<VerificationRepository>;
    userRepo = {
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    accountRepo = {
      findByUserId: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<AccountRepository>;
    sessionRepo = {
      save: jest.fn(),
      findByToken: jest.fn(),
      deleteByToken: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteByUserIdExceptToken: jest.fn(),
    } as unknown as jest.Mocked<SessionRepository>;
    hasher = {
      compare: jest.fn(),
      hash: jest.fn().mockResolvedValue('hashed-new-password'),
    } as unknown as jest.Mocked<PasswordHasher>;
    uow = {
      run: jest.fn(async (fn: (tx: unknown) => Promise<void>) => {
        await fn({} as unknown);
      }),
    } as unknown as jest.Mocked<IUnitOfWork>;

    useCase = new ResetPasswordUseCase(
      verificationRepo,
      userRepo,
      accountRepo,
      sessionRepo,
      hasher,
      uow,
    );
  });

  it('resets password when OTP is valid', async () => {
    const email = 'user@example.com';
    const verification = VerificationToken.create(
      'verif-id',
      email,
      'hashed-otp',
      'password_reset',
      600000,
    );
    verificationRepo.findByIdentifierAndType.mockResolvedValue(verification);
    hasher.compare.mockResolvedValue(true);
    const user = User.create('user-id', email, 'Alice');
    userRepo.findByEmail.mockResolvedValue(user);
    const account = Account.createCredentials(
      'acc-id',
      'user-id',
      email,
      Password.createFromHash('old-hash'),
    );
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
