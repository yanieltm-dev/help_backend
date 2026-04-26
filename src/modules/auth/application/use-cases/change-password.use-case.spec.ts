import { Account } from '../../domain/entities/account.entity';
import { InvalidCurrentPasswordError } from '../../domain/errors/invalid-current-password.error';
import { InvalidNewPasswordError } from '../../domain/errors/invalid-new-password.error';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import { Password } from '../../domain/value-objects/password.vo';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { ChangePasswordUseCase } from './change-password.use-case';
import { createChangePasswordUseCaseSut } from './test-utils/sut/create-change-password-use-case-sut';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let accountRepo: jest.Mocked<AccountRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let hasher: jest.Mocked<PasswordHasher>;

  beforeEach(() => {
    const sut = createChangePasswordUseCaseSut();
    ({ useCase, accountRepo, sessionRepo, hasher } = sut);
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

    expect(accountRepo.save).toHaveBeenCalled();

    expect(sessionRepo.deleteByUserIdExceptToken).toHaveBeenCalled();
  });

  it('deletes all sessions when currentRefreshToken is empty', async () => {
    const inputUserId = 'user-id';
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
      currentRefreshToken: '',
    });

    expect(accountRepo.save).toHaveBeenCalled();

    expect(sessionRepo.deleteByUserId).toHaveBeenCalledWith(
      inputUserId,
      expect.anything(),
    );
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
