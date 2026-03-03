import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  VERIFICATION_REPOSITORY,
  PASSWORD_HASHER,
  EVENT_BUS,
} from '../../auth.tokens';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { VerificationToken } from '../../domain/entities/verification-token.entity';
import { VerificationResendedDomainEvent } from '../../domain/events/verification-resended.domain-event';
import { Otp } from '../../domain/value-objects/otp.vo';
import { generateUuidV7 } from '@/shared/utils/uuid';
import { BadRequestException } from '@nestjs/common';

export interface ResendVerificationCommand {
  email: string;
}

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(VERIFICATION_REPOSITORY)
    private readonly verificationRepo: VerificationRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async execute(command: ResendVerificationCommand): Promise<void> {
    const { email } = command;

    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // TODO: Implement rate limiting (max 3 resends per hour)
    // For now, we just invalidate previous ones

    await this.verificationRepo.invalidateAllForIdentifier(
      email,
      'email_verification',
    );

    const otp = Otp.generate().value;
    const hashedOtp = await this.hasher.hash(otp);

    const verification = VerificationToken.create(
      generateUuidV7(),
      email,
      hashedOtp,
      'email_verification',
      10 * 60 * 1000, // 10 minutes
    );

    await this.verificationRepo.save(verification);
    this.eventBus.publish(new VerificationResendedDomainEvent(email, otp));
  }
}
