import { InvalidFileError } from '../errors/invalid-file.error';
import { FileValidator } from './file-validator.service';

describe('FileValidator', () => {
  let validator: FileValidator;
  const config = {
    maxFileSize: 5242880, // 5MB
    allowedMimeTypes: ['image/*', 'application/pdf', 'video/*'],
  };

  beforeEach(() => {
    validator = new FileValidator(config);
  });

  describe('validateMimeType', () => {
    it('should accept allowed mime types', () => {
      expect(() => validator.validateMimeType('image/jpeg')).not.toThrow();
      expect(() => validator.validateMimeType('image/png')).not.toThrow();
      expect(() => validator.validateMimeType('application/pdf')).not.toThrow();
      expect(() => validator.validateMimeType('video/mp4')).not.toThrow();
    });

    it('should reject disallowed mime types', () => {
      expect(() => validator.validateMimeType('text/html')).toThrow(
        InvalidFileError,
      );
    });

    it('should use wildcard matching', () => {
      expect(() => validator.validateMimeType('image/webp')).not.toThrow();
      expect(() => validator.validateMimeType('video/webm')).not.toThrow();
    });

    it('should reject empty or invalid mime types', () => {
      expect(() => validator.validateMimeType('')).toThrow(InvalidFileError);
      expect(() =>
        validator.validateMimeType(null as unknown as string),
      ).toThrow(InvalidFileError);
    });
  });

  describe('validateMaxFileSize', () => {
    it('should accept files within size limit', () => {
      expect(() => validator.validateMaxFileSize(5242880)).not.toThrow(); // 5MB
    });

    it('should reject files exceeding size limit', () => {
      expect(() => validator.validateMaxFileSize(5242881)).toThrow(
        InvalidFileError,
      );
      expect(() => validator.validateMaxFileSize(10485760)).toThrow(
        InvalidFileError,
      ); // 10MB
    });
  });

  describe('validateAll', () => {
    it('should validate mime type and size together', () => {
      expect(() =>
        validator.validateAll({
          fileName: 'document.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024000,
        }),
      ).not.toThrow();
    });

    it('should throw error if any validation fails', () => {
      expect(() =>
        validator.validateAll({
          fileName: 'document.pdf',
          mimeType: 'application/x-executable',
          fileSize: 1024000,
        }),
      ).toThrow(InvalidFileError);

      expect(() =>
        validator.validateAll({
          fileName: 'document.pdf',
          mimeType: 'application/pdf',
          fileSize: 10485760,
        }),
      ).toThrow(InvalidFileError);
    });
  });
});
