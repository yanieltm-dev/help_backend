import { InvalidFileError } from '../errors/invalid-file.error';
import { FileSize } from './file-size.vo';

describe('FileSize', () => {
  it('should create a valid FileSize', () => {
    const fileSize = FileSize.create(1024);
    expect(fileSize.value).toBe(1024);
  });

  it('should throw InvalidFileError if size is 0 or negative', () => {
    expect(() => FileSize.create(0)).toThrow(InvalidFileError);
    expect(() => FileSize.create(-1)).toThrow(InvalidFileError);
  });

  describe('exceeds', () => {
    it('should correctly determine if size exceeds limit', () => {
      const fileSize = FileSize.create(1024000); // 1MB (in bytes approx)
      expect(fileSize.exceeds(5242880)).toBe(false); // 5MB limit
      expect(fileSize.exceeds(1024000)).toBe(false); // Equal to limit
      expect(fileSize.exceeds(500000)).toBe(true); // Exceeds 500KB limit
    });
  });
});
