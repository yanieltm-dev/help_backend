import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import {
  InvalidOtpError,
  ExpiredOtpError,
  MaxAttemptsExceededError,
} from '../../domain/errors/otp.errors';

export interface VerifyEmailCommand {
  email: string;
  code: string;
}

export class VerifyEmailUseCase {
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly userRepo: UserRepository,
    private readonly verificationRepo: VerificationRepository,
    private readonly hasher: PasswordHasher,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<void> {
    const { email, code } = command;

    const verification = await this.verificationRepo.findByIdentifierAndType(
      email,
      'email_verification',
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

    const verifiedUser = user.verifyEmail();

    await this.uow.run(async (tx) => {
      await this.userRepo.save(verifiedUser, tx);
      await this.verificationRepo.delete(verification.id);
    });
  }
}
