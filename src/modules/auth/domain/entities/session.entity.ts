export class Session {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    userId: string,
    token: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string,
  ): Session {
    return new Session(id, userId, token, expiresAt, ipAddress, userAgent);
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }
}
