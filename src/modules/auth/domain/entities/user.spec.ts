import { User } from './user.entity';
import { Email } from '../value-objects/email.vo';

describe('User Entity', () => {
  it('should create a user instance', () => {
    const id = 'uuid-v7-123';
    const emailStr = 'test@example.com';
    const name = 'Test User';

    const user = User.create(id, emailStr, name);

    expect(user.id).toBe(id);
    expect(user.email).toBeInstanceOf(Email);
    expect(user.email.value).toBe(emailStr);
    expect(user.name).toBe(name);
    expect(user.createdAt).toBeInstanceOf(Date);
  });
});
