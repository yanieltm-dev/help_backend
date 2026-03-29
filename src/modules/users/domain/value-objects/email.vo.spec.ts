import { Email } from './email.vo';

describe('Email Value Object', () => {
  it('should create an Email successfully with valid email', () => {
    const email = Email.create('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('should normalize email to lowercase', () => {
    const email = Email.create('TEST@EXAMPLE.COM');
    expect(email.value).toBe('test@example.com');
  });

  it('should trim whitespace from email', () => {
    const email = Email.create('  test@example.com  ');
    expect(email.value).toBe('test@example.com');
  });

  it('should throw Error for invalid email format', () => {
    expect(() => Email.create('invalid')).toThrow('Invalid email format');
    expect(() => Email.create('invalid@')).toThrow('Invalid email format');
    expect(() => Email.create('@example.com')).toThrow('Invalid email format');
    expect(() => Email.create('invalid@example')).toThrow(
      'Invalid email format',
    );
    expect(() => Email.create('')).toThrow('Invalid email format');
  });
});
