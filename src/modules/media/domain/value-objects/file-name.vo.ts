import { InvalidFileError } from '../errors/invalid-file.error';

/**
 * Value Object representing a file name.
 * Encapsulates validation logic for file names.
 */
export class FileName {
  private constructor(public readonly value: string) {}

  /**
   * Creates a new FileName instance after validation.
   * @param value The raw file name string.
   * @throws InvalidFileError if the file name is empty or invalid.
   */
  static create(value: string): FileName {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new InvalidFileError('File name is required and cannot be empty');
    }

    return new FileName(value.trim());
  }

  /**
   * Gets the file extension from the name.
   */
  getExtension(): string {
    const dotIndex = this.value.lastIndexOf('.');
    return dotIndex > 0 ? this.value.substring(dotIndex + 1).toLowerCase() : '';
  }
}
