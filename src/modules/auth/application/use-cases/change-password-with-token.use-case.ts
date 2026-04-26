import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { UserRepository } from '@/modules/users/domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { VerificationTokenType } from '../../domain/entities/verification-token.entity';
import { Password } from '../../domain/value-objects/password.vo';
import { Account } from '../../domain/entities/account.entity';
import {
  ExpiredChangePasswordTokenError,
  InvalidChangePasswordTokenError,
} from '../../domain/errors/change-password-token.errors';

export interface ChangePasswordWithTokenCommand {
  changePasswordToken: string;
  newPassword: string;
}

export class ChangePasswordWithTokenUseCase {
  constructor(
    private readonly verificationRepo: VerificationRepository,
    private readonly userRepo: UserRepository,
    private readonly accountRepo: AccountRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: ChangePasswordWithTokenCommand): Promise<void> {
    const { changePasswordToken, newPassword } = command;

    const parts = changePasswordToken.split('.');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new InvalidChangePasswordTokenError();
    }

    const [tokenId, secret] = parts;

    const verification = await this.verificationRepo.findByIdAndType(
      tokenId,
      VerificationTokenType.PASSWORD_CHANGE,
    );

    if (!verification) {
      throw new InvalidChangePasswordTokenError();
    }

    if (verification.isExpired()) {
      throw new ExpiredChangePasswordTokenError();
    }

    const isValid = await this.hasher.compare(secret, verification.token);
    if (!isValid) {
      throw new InvalidChangePasswordTokenError();
    }

    const user = await this.userRepo.findByEmail(verification.identifier);
    if (!user) {
      throw new InvalidChangePasswordTokenError();
    }

    const account = await this.accountRepo.findByUserId(user.id);
    if (!account) {
      throw new InvalidChangePasswordTokenError();
    }

    Password.createRaw(newPassword);
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
      await this.verificationRepo.delete(tokenId);
      await this.sessionRepo.deleteByUserId(user.id, tx);
    });
  }
}
