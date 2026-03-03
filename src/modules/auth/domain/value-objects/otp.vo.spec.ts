import { Otp } from './otp.vo';

describe('Otp Value Object', () => {
  it('should generate a 6-digit numeric string', () => {
    const otp = Otp.generate();
    expect(otp.value).toMatch(/^\d{6}$/);
  });

  it('should create an Otp successfully with valid 6-digit string', () => {
    const otp = Otp.create('123456');
    expect(otp.value).toBe('123456');
  });

  it('should throw Error for invalid OTP format', () => {
    expect(() => Otp.create('12345')).toThrow(
      'Invalid OTP: must be exactly 6 digits',
    );
    expect(() => Otp.create('1234567')).toThrow(
      'Invalid OTP: must be exactly 6 digits',
    );
    expect(() => Otp.create('abcdef')).toThrow(
      'Invalid OTP: must be exactly 6 digits',
    );
  });
});
