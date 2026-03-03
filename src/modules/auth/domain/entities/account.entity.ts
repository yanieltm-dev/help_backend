import { Password } from '../value-objects/password.vo';

export class Account {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly providerId: string,
    public readonly providerAccountId: string,
    public readonly password?: Password,
    public readonly failedLoginAttempts: number = 0,
    public readonly lockedUntil?: Date,
    public readonly createdAt: Date = new Date(),
  ) {}

  static createCredentials(
    id: string,
    userId: string,
    email: string,
    password: Password,
  ): Account {
    return new Account(id, userId, 'credentials', email, password);
  }

  isLocked(): boolean {
    if (!this.lockedUntil) return false;
    return this.lockedUntil > new Date();
  }

  recordFailedAttempt(maxAttempts: number, lockoutDurationMs: number): Account {
    const attempts = this.failedLoginAttempts + 1;
    let lockedUntil = this.lockedUntil;

    if (attempts >= maxAttempts) {
      lockedUntil = new Date(Date.now() + lockoutDurationMs);
    }

    return new Account(
      this.id,
      this.userId,
      this.providerId,
      this.providerAccountId,
      this.password,
      attempts,
      lockedUntil,
      this.createdAt,
    );
  }

  resetFailedAttempts(): Account {
    return new Account(
      this.id,
      this.userId,
      this.providerId,
      this.providerAccountId,
      this.password,
      0,
      undefined,
      this.createdAt,
    );
  }
}
