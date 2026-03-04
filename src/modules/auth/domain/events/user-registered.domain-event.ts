import { DomainEvent } from '@/shared/domain/events/domain-event';

export class UserRegisteredDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'user.registered' as const;
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly verificationToken: string,
  ) {
    super();
  }

  get eventName(): string {
    return UserRegisteredDomainEvent.EVENT_NAME;
  }
}
