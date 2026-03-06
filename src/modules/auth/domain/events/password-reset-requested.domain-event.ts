import { DomainEvent } from '@/shared/domain/events/domain-event';

export class PasswordResetRequestedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'password.reset.requested' as const;

  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly otp: string,
    public readonly otpExpiresInMs: number,
  ) {
    super();
  }

  get eventName(): string {
    return PasswordResetRequestedDomainEvent.EVENT_NAME;
  }
}
