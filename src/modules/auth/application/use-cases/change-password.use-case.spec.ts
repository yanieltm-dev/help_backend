import { ChangePasswordUseCase } from './change-password.use-case';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { Account } from '../../domain/entities/account.entity';
import { Password } from '../../domain/value-objects/password.vo';
import { InvalidCurrentPasswordError } from '../../domain/errors/invalid-current-password.error';
import { InvalidNewPasswordError } from '../../domain/errors/invalid-new-password.error';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let accountRepo: jest.Mocked<AccountRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(() => {
    accountRepo = {
      findByUserId: jest.fn(),
      save: jest.fn(),
    };
    sessionRepo = {
      save: jest.fn(),
      findByToken: jest.fn(),
      deleteByToken: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteByUserIdExceptToken: jest.fn(),
    };
    hasher = {
      compare: jest.fn(),
      hash: jest.fn(),
    };
    uow = {
      run: jest
        .fn()
        .mockImplementation(<T>(work: (tx?: unknown) => Promise<T>) =>
          work({} as unknown),
        ),
    } as unknown as jest.Mocked<IUnitOfWork>;

    useCase = new ChangePasswordUseCase(accountRepo, sessionRepo, hasher, uow);
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
