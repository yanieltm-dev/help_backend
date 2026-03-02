import { Email } from './email.vo';

describe('Email Value Object', () => {
  it('should create a valid email', () => {
    const emailStr = 'test@example.com';
    const email = Email.create(emailStr);
    expect(email.value).toBe(emailStr);
  });

  it('should normalize email to lowercase and trim it', () => {
    const emailStr = '  TEST@Example.Com  ';
    const email = Email.create(emailStr);
    expect(email.value).toBe('test@example.com');
  });

  it('should throw error for invalid email format', () => {
    expect(() => Email.create('invalid-email')).toThrow('Invalid email format');
    expect(() => Email.create('test@')).toThrow('Invalid email format');
    expect(() => Email.create('@example.com')).toThrow('Invalid email format');
  });
});
