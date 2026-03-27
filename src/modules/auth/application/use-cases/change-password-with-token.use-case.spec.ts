import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { parseDuration } from '@/shared/utils/parse-duration';
import {
  VerificationToken,
  VerificationTokenType,
} from '../../domain/entities/verification-token.entity';
import {
  ExpiredChangePasswordTokenError,
  InvalidChangePasswordTokenError,
} from '../../domain/errors/change-password-token.errors';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { ChangePasswordWithTokenUseCase } from './change-password-with-token.use-case';
import { AuthEntitiesTestFactory } from './test-utils/auth-entities-test-factory';
import { createChangePasswordWithTokenUseCaseSut } from './test-utils/sut/create-change-password-with-token-use-case-sut';

describe('ChangePasswordWithTokenUseCase', () => {
  let useCase: ChangePasswordWithTokenUseCase;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let accountRepo: jest.Mocked<AccountRepository>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(() => {
    const sut = createChangePasswordWithTokenUseCaseSut();
    useCase = sut.useCase;
    verificationRepo = sut.verificationRepo;
    userRepo = sut.userRepo;
    accountRepo = sut.accountRepo;
    sessionRepo = sut.sessionRepo;
    hasher = sut.hasher;
    uow = sut.uow;
  });

  it('changes password, deletes token, and revokes sessions when token is valid', async () => {
    const email = 'user@example.com';
    const tokenId = 'token-id';
    const secret = 'token-secret';
    const tokenVerification = new VerificationToken(
      tokenId,
      email,
      'hashed-secret',
      VerificationTokenType.PASSWORD_CHANGE,
      new Date(Date.now() + parseDuration('15m')),
      0,
    );
    verificationRepo.findByIdAndType.mockResolvedValue(tokenVerification);
    hasher.compare.mockResolvedValue(true);

    const user = AuthEntitiesTestFactory.createUser({ id: 'user-id', email });
    userRepo.findByEmail.mockResolvedValue(user);
    const account = AuthEntitiesTestFactory.createCredentialsAccount({
      id: 'acc-id',
      userId: 'user-id',
      email,
      passwordHash: 'old-hash',
    });
    accountRepo.findByUserId.mockResolvedValue(account);

    await useCase.execute({
      changePasswordToken: `${tokenId}.${secret}`,
      newPassword: 'New-password-123!',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(uow.run).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(accountRepo.save).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessionRepo.deleteByUserId).toHaveBeenCalledWith(
      'user-id',
      expect.anything(),
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.delete).toHaveBeenCalledWith(tokenId);
  });

  it('throws InvalidChangePasswordTokenError when token format is invalid', async () => {
    await expect(
      useCase.execute({
        changePasswordToken: 'not-a-valid-token',
        newPassword: 'new-password-123!',
      }),
    ).rejects.toThrow(InvalidChangePasswordTokenError);
  });

  it('throws InvalidChangePasswordTokenError when token verification not found', async () => {
    verificationRepo.findByIdAndType.mockResolvedValue(null);

    await expect(
      useCase.execute({
        changePasswordToken: 'token-id.token-secret',
        newPassword: 'new-password-123!',
      }),
    ).rejects.toThrow(InvalidChangePasswordTokenError);
  });

  it('throws ExpiredChangePasswordTokenError when token is expired', async () => {
    const tokenVerification = new VerificationToken(
      'token-id',
      'user@example.com',
      'hashed-secret',
      VerificationTokenType.PASSWORD_CHANGE,
      new Date(Date.now() - 1000),
      0,
    );
    verificationRepo.findByIdAndType.mockResolvedValue(tokenVerification);

    await expect(
      useCase.execute({
        changePasswordToken: 'token-id.token-secret',
        newPassword: 'new-password-123!',
      }),
    ).rejects.toThrow(ExpiredChangePasswordTokenError);
  });

  it('throws InvalidChangePasswordTokenError when secret does not match hash', async () => {
    const tokenVerification = new VerificationToken(
      'token-id',
      'user@example.com',
      'hashed-secret',
      VerificationTokenType.PASSWORD_CHANGE,
      new Date(Date.now() + 10000),
      0,
    );
    verificationRepo.findByIdAndType.mockResolvedValue(tokenVerification);
    hasher.compare.mockResolvedValue(false);

    await expect(
      useCase.execute({
        changePasswordToken: 'token-id.token-secret',
        newPassword: 'new-password-123!',
      }),
    ).rejects.toThrow(InvalidChangePasswordTokenError);
  });
});
