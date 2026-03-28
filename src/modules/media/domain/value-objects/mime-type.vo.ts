import { InvalidFileError } from '../errors/invalid-file.error';

export class MimeType {
  private constructor(public readonly value: string) {}

  static create(value: string): MimeType {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new InvalidFileError('MIME type is required');
    }
    return new MimeType(value.toLowerCase().trim());
  }

  matches(pattern: string): boolean {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1);
      return this.value.startsWith(prefix);
    }
    return this.value === pattern;
  }

  isImage(): boolean {
    return this.value.startsWith('image/');
  }

  isVideo(): boolean {
    return this.value.startsWith('video/');
  }
}
