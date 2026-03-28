export type ResendVerificationUseCaseConfig = {
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
import { EmailAlreadyVerifiedError } from '../../domain/errors/email-already-verified.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { VerificationResendedDomainEvent } from '../../domain/events/verification-resended.domain-event';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import { Otp } from '../../domain/value-objects/otp.vo';
import type { PasswordHasher } from '../ports/password-hasher.port';

export interface ResendVerificationCommand {
  email: string;
}

export class ResendVerificationUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly verificationRepo: VerificationRepository,
    private readonly hasher: PasswordHasher,
    private readonly eventBus: IEventBus,
    private readonly idGenerator: IIdGenerator,
    private readonly config: ResendVerificationUseCaseConfig,
  ) {}

  async execute(command: ResendVerificationCommand): Promise<void> {
    const { email } = command;

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (user.emailVerified) {
      throw new EmailAlreadyVerifiedError();
    }

    const windowStart = new Date(Date.now() - this.config.windowMs);
    const recentCount =
      await this.verificationRepo.countRecentForIdentifierAndTypeSince(
        email,
        VerificationTokenType.EMAIL_VERIFICATION,
        windowStart,
      );

    if (recentCount >= this.config.maxRequests) {
      return;
    }

    await this.verificationRepo.invalidateAllForIdentifier(
      email,
      VerificationTokenType.EMAIL_VERIFICATION,
    );

    const otp = Otp.generate().value;
    const hashedOtp = await this.hasher.hash(otp);

    const verification = VerificationToken.create(
      this.idGenerator.generate(),
      email,
      hashedOtp,
      VerificationTokenType.EMAIL_VERIFICATION,
      this.config.otpExpiresInMs,
    );

    await this.verificationRepo.save(verification);

    const profile = await this.profileRepo.findByUserId(user.id);

    this.eventBus.publish(
      new VerificationResendedDomainEvent(
        email,
        otp,
        profile?.displayName ?? profile?.username ?? '',
        this.config.otpExpiresInMs,
      ),
    );
  }
}
