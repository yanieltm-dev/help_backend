import { InvalidFileError } from '../errors/invalid-file.error';
import { MimeType } from './mime-type.vo';

describe('MimeType', () => {
  it('should create a valid MimeType', () => {
    const mimeType = MimeType.create('IMAGE/JPEG');
    expect(mimeType.value).toBe('image/jpeg');
  });

  it('should throw InvalidFileError if mimeType is empty or invalid', () => {
    expect(() => MimeType.create('')).toThrow(InvalidFileError);
    expect(() => MimeType.create('   ')).toThrow(InvalidFileError);
    expect(() => MimeType.create(null as unknown as string)).toThrow(
      InvalidFileError,
    );
  });

  describe('matches', () => {
    it('should correctly match patterns', () => {
      const mimeType = MimeType.create('image/png');
      expect(mimeType.matches('image/png')).toBe(true);
      expect(mimeType.matches('image/*')).toBe(true);
      expect(mimeType.matches('video/*')).toBe(false);
      expect(mimeType.matches('application/pdf')).toBe(false);
    });
  });

  describe('helpers', () => {
    it('should correctly identify image types', () => {
      expect(MimeType.create('image/jpeg').isImage()).toBe(true);
      expect(MimeType.create('application/pdf').isImage()).toBe(false);
    });

    it('should correctly identify video types', () => {
      expect(MimeType.create('video/mp4').isVideo()).toBe(true);
      expect(MimeType.create('image/jpeg').isVideo()).toBe(false);
    });
  });
});
