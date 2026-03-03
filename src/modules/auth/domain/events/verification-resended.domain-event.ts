export class VerificationResendedDomainEvent {
  static readonly EVENT_NAME = 'verification.resended' as const;
  constructor(
    public readonly email: string,
    public readonly verificationToken: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
