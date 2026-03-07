import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { InvalidCurrentPasswordError } from '../../domain/errors/invalid-current-password.error';
import { InvalidNewPasswordError } from '../../domain/errors/invalid-new-password.error';
import { Password } from '../../domain/value-objects/password.vo';
import { Account } from '../../domain/entities/account.entity';

export interface ChangePasswordCommand {
  userId: string;
  currentPassword: string;
  newPassword: string;
  currentRefreshToken: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const { userId, currentPassword, newPassword, currentRefreshToken } =
      command;

    const account = await this.accountRepo.findByUserId(userId);
    if (!account || !account.password) {
      throw new InvalidCurrentPasswordError();
    }

    const isValidCurrentPassword = await this.hasher.compare(
      currentPassword,
      account.password.value,
    );
    if (!isValidCurrentPassword) {
      throw new InvalidCurrentPasswordError();
    }

    try {
      Password.createRaw(newPassword);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid password';
      throw new InvalidNewPasswordError(message);
    }

    const hashedPassword = await this.hasher.hash(newPassword);
    const updatedAccount = new Account(
      account.id,
      account.userId,
      account.providerId,
      account.providerAccountId,
      Password.createFromHash(hashedPassword),
      account.failedLoginAttempts,
      account.lockedUntil,
      account.createdAt,
    );

    await this.uow.run(async (tx) => {
      await this.accountRepo.save(updatedAccount, tx);
      if (!currentRefreshToken) {
        await this.sessionRepo.deleteByUserId(userId, tx);
        return;
      }
      await this.sessionRepo.deleteByUserIdExceptToken(
        userId,
        currentRefreshToken,
        tx,
      );
    });
  }
}
