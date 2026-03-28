import { InvalidFileError } from '../errors/invalid-file.error';

/**
 * Value Object representing a file size in bytes.
 * Encapsulates validation logic for file sizes.
 */
export class FileSize {
  private constructor(public readonly value: number) {}

  /**
   * Creates a new FileSize instance after validation.
   * @param value The file size in bytes.
   * @throws InvalidFileError if the size is 0 or negative.
   */
  static create(value: number): FileSize {
    if (value <= 0) {
      throw new InvalidFileError('File size must be greater than 0');
    }

    return new FileSize(value);
  }

  /**
   * Returns whether the size exceeds a maximum limit.
   */
  exceeds(maxSize: number): boolean {
    return this.value > maxSize;
  }
}
