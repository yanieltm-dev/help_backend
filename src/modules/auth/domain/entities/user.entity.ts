import { Email } from '../value-objects/email.vo';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly name: string,
    public readonly emailVerified: boolean = false,
    public readonly status: string = 'pending_verification',
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    email: string,
    name: string,
    emailVerified: boolean = false,
    status: string = 'pending_verification',
    createdAt: Date = new Date(),
  ): User {
    return new User(
      id,
      Email.create(email),
      name,
      emailVerified,
      status,
      createdAt,
    );
  }

  verifyEmail(): User {
    return User.create(
      this.id,
      this.email.value,
      this.name,
      true,
      'active',
      this.createdAt,
    );
  }
}
