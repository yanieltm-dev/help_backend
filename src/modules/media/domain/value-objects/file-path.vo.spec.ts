import { InvalidFileError } from '../errors/invalid-file.error';
import { FilePath } from './file-path.vo';

describe('FilePath', () => {
  it('should create and normalize a valid FilePath', () => {
    const filePath = FilePath.create('folder/subfolder/file.pdf');
    expect(filePath.value).toBe('folder/subfolder/file.pdf');

    const normalizedPath = FilePath.create('\\folder\\file.pdf');
    expect(normalizedPath.value).toBe('folder/file.pdf');

    const trimmedPath = FilePath.create('/absolute/path.pdf');
    expect(trimmedPath.value).toBe('absolute/path.pdf');
  });

  it('should throw InvalidFileError if path is empty or invalid', () => {
    expect(() => FilePath.create('')).toThrow(InvalidFileError);
    expect(() => FilePath.create(null as unknown as string)).toThrow(
      InvalidFileError,
    );
  });

  describe('helpers', () => {
    it('should correctly extract folder', () => {
      expect(FilePath.create('a/b/c.pdf').getFolder()).toBe('a/b');
      expect(FilePath.create('file.pdf').getFolder()).toBeNull();
    });

    it('should correctly extract filename', () => {
      expect(FilePath.create('a/b/c.pdf').getFilename()).toBe('c.pdf');
      expect(FilePath.create('file.pdf').getFilename()).toBe('file.pdf');
    });

    it('should correctly add prefix', () => {
      const path = FilePath.create('file.pdf');
      const prefixed = path.withPrefix('uploads');
      expect(prefixed.value).toBe('uploads/file.pdf');
    });
  });
});
