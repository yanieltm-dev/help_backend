import { DomainEvent } from '@/shared/domain/events/domain-event';

export class VerificationResendedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'verification.resended' as const;
  constructor(
    public readonly email: string,
    public readonly verificationToken: string,
  ) {
    super();
  }

  get eventName(): string {
    return VerificationResendedDomainEvent.EVENT_NAME;
  }
}
