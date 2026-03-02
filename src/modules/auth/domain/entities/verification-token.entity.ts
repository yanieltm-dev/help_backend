export class VerificationToken {
  constructor(
    public readonly id: string,
    public readonly identifier: string,
    public readonly token: string,
    public readonly type: 'email_verification' | 'password_reset',
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    identifier: string,
    token: string,
    type: 'email_verification' | 'password_reset',
    expiresInMs: number = 24 * 60 * 60 * 1000,
  ): VerificationToken {
    return new VerificationToken(
      id,
      identifier,
      token,
      type,
      new Date(Date.now() + expiresInMs),
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
