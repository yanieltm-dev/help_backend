import { Password } from '../value-objects/password.vo';

export class Account {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly providerId: string,
    public readonly providerAccountId: string,
    public readonly password?: Password,
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
}
