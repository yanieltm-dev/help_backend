export class Email {
  private constructor(public readonly value: string) {}

  static create(value: string): Email {
    const normalized = value.toLowerCase().trim();
    if (!this.isValid(normalized)) {
      throw new Error('Invalid email format');
    }
    return new Email(normalized);
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
