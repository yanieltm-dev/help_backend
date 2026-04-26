import { Email } from '../value-objects/email.vo';

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending_verification',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly emailVerified: boolean = false,
    public readonly status: UserStatus = UserStatus.PENDING,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    email: string,
    emailVerified: boolean = false,
    status: UserStatus = UserStatus.PENDING,
    createdAt: Date = new Date(),
  ): User {
    return new User(id, Email.create(email), emailVerified, status, createdAt);
  }

  verifyEmail(): User {
    return User.create(
      this.id,
      this.email.value,
      true,
      UserStatus.ACTIVE,
      this.createdAt,
    );
  }
}
