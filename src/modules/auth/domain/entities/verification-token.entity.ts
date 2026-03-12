export const VerificationTokenType = {
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGE: 'password_change',
} as const;

export type VerificationTokenType =
  (typeof VerificationTokenType)[keyof typeof VerificationTokenType];

export class VerificationToken {
  constructor(
    public readonly id: string,
    public readonly identifier: string,
    public readonly token: string,
    public readonly type: VerificationTokenType,
    public readonly expiresAt: Date,
    public readonly attempts: number = 0,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    identifier: string,
    token: string,
    type: VerificationTokenType,
    expiresInMs: number = 24 * 60 * 60 * 1000,
    attempts: number = 0,
  ): VerificationToken {
    return new VerificationToken(
      id,
      identifier,
      token,
      type,
      new Date(Date.now() + expiresInMs),
      attempts,
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  incrementAttempts(): VerificationToken {
    return new VerificationToken(
      this.id,
      this.identifier,
      this.token,
      this.type,
      this.expiresAt,
      this.attempts + 1,
      this.createdAt,
    );
  }

  withFixedExpiration(expiresAt: Date, createdAt: Date): VerificationToken {
    return new VerificationToken(
      this.id,
      this.identifier,
      this.token,
      this.type,
      expiresAt,
      this.attempts,
      createdAt,
    );
  }

  hasExceededMaxAttempts(maxAttempts: number): boolean {
    return this.attempts >= maxAttempts;
  }
}
