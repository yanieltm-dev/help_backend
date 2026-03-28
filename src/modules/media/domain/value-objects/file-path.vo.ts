import { InvalidFileError } from '../errors/invalid-file.error';

export class FilePath {
  private constructor(public readonly value: string) {}

  static create(path: string): FilePath {
    if (!path || typeof path !== 'string' || path.trim().length === 0) {
      throw new InvalidFileError('File path is required');
    }
    if (path.includes('..')) {
      throw new InvalidFileError(
        'Invalid file path: path traversal not allowed',
      );
    }
    const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
    return new FilePath(normalized);
  }

  getFolder(): string | null {
    const lastSlash = this.value.lastIndexOf('/');
    return lastSlash > 0 ? this.value.substring(0, lastSlash) : null;
  }

  getFilename(): string {
    const lastSlash = this.value.lastIndexOf('/');
    return lastSlash >= 0 ? this.value.substring(lastSlash + 1) : this.value;
  }

  withPrefix(prefix: string): FilePath {
    return FilePath.create(`${prefix}/${this.value}`);
  }
}
