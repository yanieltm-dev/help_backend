export class Password {
  private constructor(
    public readonly value: string,
    public readonly isHashed: boolean,
  ) {}

  static createRaw(value: string): Password {
    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/\d/.test(value)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/[^a-zA-Z0-9]/.test(value)) {
      throw new Error('Password must contain at least one special character');
    }

    return new Password(value, false);
  }

  static createFromHash(hash: string): Password {
    return new Password(hash, true);
  }
}
