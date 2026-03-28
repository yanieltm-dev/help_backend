import { InvalidFileError } from '../errors/invalid-file.error';

export interface FileValidationConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
}

export interface FileValidationParams {
  fileName: string;
  mimeType: string;
  fileSize: number;
}

export class FileValidator {
  constructor(private readonly config: FileValidationConfig) {}

  validateMimeType(mimeType: string): void {
    if (
      !mimeType ||
      typeof mimeType !== 'string' ||
      mimeType.trim().length === 0
    ) {
      throw new InvalidFileError('MIME type is required');
    }

    const isAllowed = this.config.allowedMimeTypes.some((pattern) =>
      this.matchesMimeType(mimeType, pattern),
    );

    if (!isAllowed) {
      throw new InvalidFileError(
        `File type "${mimeType}" is not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  validateMaxFileSize(fileSize: number): void {
    if (fileSize > this.config.maxFileSize) {
      throw new InvalidFileError(
        `File size (${fileSize} bytes) exceeds maximum allowed size of ${this.config.maxFileSize} bytes`,
      );
    }
  }

  validateAll(params: FileValidationParams): void {
    this.validateMimeType(params.mimeType);
    this.validateMaxFileSize(params.fileSize);
  }

  private matchesMimeType(mimeType: string, pattern: string): boolean {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1);
      return mimeType.startsWith(prefix);
    }
    return mimeType === pattern;
  }
}
