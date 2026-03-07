import { ChangePasswordUseCase } from './change-password.use-case';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { Account } from '../../domain/entities/account.entity';
import { Password } from '../../domain/value-objects/password.vo';
import { InvalidCurrentPasswordError } from '../../domain/errors/invalid-current-password.error';
import { InvalidNewPasswordError } from '../../domain/errors/invalid-new-password.error';
import { createChangePasswordUseCaseSut } from './test-utils/sut/create-change-password-use-case-sut';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let accountRepo: jest.Mocked<AccountRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let hasher: jest.Mocked<PasswordHasher>;

  beforeEach(() => {
    const sut = createChangePasswordUseCaseSut();
    useCase = sut.useCase;
    accountRepo = sut.accountRepo;
    sessionRepo = sut.sessionRepo;
    hasher = sut.hasher;
  });

  it('changes password and invalidates sessions except current one', async () => {
    const inputUserId = 'user-id';
    const inputCurrentRefreshToken = 'refresh-token-1';
    const account = new Account(
      'acc-id',
      inputUserId,
      'credentials',
      'user@example.com',
      Password.createFromHash('old-hash'),
    );
    accountRepo.findByUserId.mockResolvedValue(account);
    hasher.compare.mockResolvedValue(true);
    hasher.hash.mockResolvedValue('new-hash');

    await useCase.execute({
      userId: inputUserId,
      currentPassword: 'Password123!',
      newPassword: 'NewPassword123!',
      currentRefreshToken: inputCurrentRefreshToken,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(accountRepo.save).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessionRepo.deleteByUserIdExceptToken).toHaveBeenCalled();
  });

  it('throws InvalidCurrentPasswordError when current password is incorrect', async () => {
    const account = new Account(
      'acc-id',
      'user-id',
      'credentials',
      'user@example.com',
      Password.createFromHash('old-hash'),
    );
    accountRepo.findByUserId.mockResolvedValue(account);
    hasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        userId: 'user-id',
        currentPassword: 'wrong',
        newPassword: 'NewPassword123!',
        currentRefreshToken: 'refresh-token',
      }),
    ).rejects.toThrow(InvalidCurrentPasswordError);
  });

  it('throws InvalidNewPasswordError when new password does not meet policy', async () => {
    const account = new Account(
      'acc-id',
      'user-id',
      'credentials',
      'user@example.com',
      Password.createFromHash('old-hash'),
    );
    accountRepo.findByUserId.mockResolvedValue(account);
    hasher.compare.mockResolvedValue(true);

    await expect(
      useCase.execute({
        userId: 'user-id',
        currentPassword: 'Password123!',
        newPassword: '123',
        currentRefreshToken: 'refresh-token',
      }),
    ).rejects.toThrow(InvalidNewPasswordError);
  });
});
