export class Password {
  private constructor(
    public readonly value: string,
    public readonly isHashed: boolean,
  ) {}

  static createRaw(value: string): Password {
    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    return new Password(value, false);
  }

  static createFromHash(hash: string): Password {
    return new Password(hash, true);
  }
}
