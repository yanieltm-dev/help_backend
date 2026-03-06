export type RequestPasswordResetUseCaseConfig = {
  otpExpiresInMs: number;
  maxRequests: number;
  windowMs: number;
};
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { VerificationToken } from '../../domain/entities/verification-token.entity';
import { Otp } from '../../domain/value-objects/otp.vo';
import { PasswordResetRequestedDomainEvent } from '../../domain/events/password-reset-requested.domain-event';

export interface RequestPasswordResetCommand {
  email: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly verificationRepo: VerificationRepository,
    private readonly hasher: PasswordHasher,
    private readonly eventBus: IEventBus,
    private readonly idGenerator: IIdGenerator,
    private readonly config: RequestPasswordResetUseCaseConfig,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<void> {
    const { email } = command;

    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      // Security: do not filter existence of email
      return;
    }

    const windowStart = new Date(Date.now() - this.config.windowMs);
    const recentCount =
      await this.verificationRepo.countRecentForIdentifierAndTypeSince(
        email,
        'password_reset',
        windowStart,
      );

    if (recentCount >= this.config.maxRequests) {
      // Security: do not reveal rate limit nor account existence
      return;
    }

    await this.verificationRepo.invalidateAllForIdentifier(
      email,
      'password_reset',
    );

    const otp = Otp.generate().value;
    const hashedOtp = await this.hasher.hash(otp);

    const verification = VerificationToken.create(
      this.idGenerator.generate(),
      email,
      hashedOtp,
      'password_reset',
      this.config.otpExpiresInMs,
    );

    await this.verificationRepo.save(verification);

    this.eventBus.publish(
      new PasswordResetRequestedDomainEvent(
        email,
        user.name,
        otp,
        this.config.otpExpiresInMs,
      ),
    );
  }
}
