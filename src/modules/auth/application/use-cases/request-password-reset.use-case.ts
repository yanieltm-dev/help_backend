export type RequestPasswordResetUseCaseConfig = {
  otpExpiresInMs: number;
  maxRequests: number;
  windowMs: number;
};
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import {
  VerificationToken,
  VerificationTokenType,
} from '../../domain/entities/verification-token.entity';
import { PasswordResetRequestedDomainEvent } from '../../domain/events/password-reset-requested.domain-event';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import { Otp } from '../../domain/value-objects/otp.vo';
import type { PasswordHasher } from '../ports/password-hasher.port';

export interface RequestPasswordResetCommand {
  email: string;
}

export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly profileRepo: ProfileRepository,
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
        VerificationTokenType.PASSWORD_RESET,
        windowStart,
      );

    if (recentCount >= this.config.maxRequests) {
      // Security: do not reveal rate limit nor account existence
      return;
    }

    await this.verificationRepo.invalidateAllForIdentifier(
      email,
      VerificationTokenType.PASSWORD_RESET,
    );

    const otp = Otp.generate().value;
    const hashedOtp = await this.hasher.hash(otp);

    const verification = VerificationToken.create(
      this.idGenerator.generate(),
      email,
      hashedOtp,
      VerificationTokenType.PASSWORD_RESET,
      this.config.otpExpiresInMs,
    );

    await this.verificationRepo.save(verification);

    const profile = await this.profileRepo.findByUserId(user.id);

    this.eventBus.publish(
      new PasswordResetRequestedDomainEvent(
        email,
        profile?.displayName ?? profile?.username ?? '',
        otp,
        this.config.otpExpiresInMs,
      ),
    );
  }
}
