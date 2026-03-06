import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import {
  ExpiredOtpError,
  InvalidOtpError,
  MaxAttemptsExceededError,
} from '../../domain/errors/otp.errors';
import { Password } from '../../domain/value-objects/password.vo';
import { Account } from '../../domain/entities/account.entity';

export interface ResetPasswordCommand {
  email: string;
  code: string;
  newPassword: string;
}

export class ResetPasswordUseCase {
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly verificationRepo: VerificationRepository,
    private readonly userRepo: UserRepository,
    private readonly accountRepo: AccountRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const { email, code, newPassword } = command;

    const verification = await this.verificationRepo.findByIdentifierAndType(
      email,
      'password_reset',
    );

    if (!verification) {
      throw new InvalidOtpError();
    }

    if (verification.isExpired()) {
      throw new ExpiredOtpError();
    }

    if (verification.hasExceededMaxAttempts(this.MAX_ATTEMPTS)) {
      throw new MaxAttemptsExceededError();
    }

    const isValid = await this.hasher.compare(code, verification.token);

    if (!isValid) {
      const updatedVerification = verification.incrementAttempts();
      await this.verificationRepo.save(updatedVerification);
      throw new InvalidOtpError();
    }

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new InvalidOtpError();
    }

    const account = await this.accountRepo.findByUserId(user.id);
    if (!account) {
      throw new InvalidOtpError();
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
      await this.verificationRepo.delete(verification.id);
      await this.sessionRepo.deleteByUserId(user.id, tx);
    });
  }
}
