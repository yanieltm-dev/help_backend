import { randomInt } from 'node:crypto';

/**
 * Value Object for One Time Password (OTP).
 * Encapsulates OTP logic for verification.
 */
export class Otp {
  private constructor(public readonly value: string) {}

  /**
   * Generates a cryptographically secure 6-digit OTP string.
   */
  static generate(): Otp {
    const value = randomInt(100000, 999999).toString();
    return new Otp(value);
  }

  /**
   * Creates an Otp from an existing string.
   * @throws Error if value is not 6 digits.
   */
  static create(value: string): Otp {
    if (!/^\d{6}$/.test(value)) {
      throw new Error('Invalid OTP: must be exactly 6 digits');
    }
    return new Otp(value);
  }
}
