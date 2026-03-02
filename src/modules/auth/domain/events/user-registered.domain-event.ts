export class UserRegisteredDomainEvent {
  static readonly EVENT_NAME = 'user.registered' as const;
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly verificationToken: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
