import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { VerificationToken } from '../../domain/entities/verification-token.entity';
import {
  ExpiredOtpError,
  InvalidOtpError,
  MaxAttemptsExceededError,
} from '../../domain/errors/otp.errors';

export type VerifyPasswordResetOtpUseCaseConfig = {
  changePasswordTokenExpiresInMs: number;
};

export interface VerifyPasswordResetOtpCommand {
  email: string;
  otp: string;
}

export type VerifyPasswordResetOtpResult = {
  changePasswordToken: string;
};

export class VerifyPasswordResetOtpUseCase {
  private readonly MAX_ATTEMPTS = 5;

  constructor(
    private readonly verificationRepo: VerificationRepository,
    private readonly hasher: PasswordHasher,
    private readonly idGenerator: IIdGenerator,
    private readonly config: VerifyPasswordResetOtpUseCaseConfig,
  ) {}

  async execute(
    command: VerifyPasswordResetOtpCommand,
  ): Promise<VerifyPasswordResetOtpResult> {
    const { email, otp } = command;

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

    const isValid = await this.hasher.compare(otp, verification.token);

    if (!isValid) {
      const updatedVerification = verification.incrementAttempts();
      await this.verificationRepo.save(updatedVerification);
      throw new InvalidOtpError();
    }

    await this.verificationRepo.delete(verification.id);

    const tokenId = this.idGenerator.generate();
    const secret = this.idGenerator.generate();
    const hashedSecret = await this.hasher.hash(secret);

    const changePasswordToken = VerificationToken.create(
      tokenId,
      email,
      hashedSecret,
      'password_change',
      this.config.changePasswordTokenExpiresInMs,
    );

    await this.verificationRepo.save(changePasswordToken);

    return { changePasswordToken: `${tokenId}.${secret}` };
  }
}
