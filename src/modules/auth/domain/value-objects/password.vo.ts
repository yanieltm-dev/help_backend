import { PASSWORD_VALIDATION_REGEX } from './password.validation';

export class Password {
  private constructor(
    public readonly value: string,
    public readonly isHashed: boolean,
  ) {}

  static createRaw(value: string): Password {
    if (!PASSWORD_VALIDATION_REGEX.test(value)) {
      throw new Error(
        'Password must be at least 8 characters with one number, one uppercase, one lowercase, and one special character',
      );
    }

    return new Password(value, false);
  }

  static createFromHash(hash: string): Password {
    return new Password(hash, true);
  }
}
