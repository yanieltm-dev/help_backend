import { Email } from '../value-objects/email.vo';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly name: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(id: string, email: string, name: string): User {
    return new User(id, Email.create(email), name);
  }
}
