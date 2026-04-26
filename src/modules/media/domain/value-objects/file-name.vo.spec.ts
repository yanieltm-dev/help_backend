import { InvalidFileError } from '../errors/invalid-file.error';
import { FileName } from './file-name.vo';

describe('FileName', () => {
  it('should create a valid FileName', () => {
    const fileName = FileName.create('document.pdf');
    expect(fileName.value).toBe('document.pdf');
  });

  it('should trim whitespace from file names', () => {
    const fileName = FileName.create('  image.jpg  ');
    expect(fileName.value).toBe('image.jpg');
  });

  it('should throw InvalidFileError if name is empty', () => {
    expect(() => FileName.create('')).toThrow(InvalidFileError);
    expect(() => FileName.create('   ')).toThrow(InvalidFileError);
  });

  it('should throw InvalidFileError if name is null or undefined', () => {
    expect(() => FileName.create(null as unknown as string)).toThrow(
      InvalidFileError,
    );
    expect(() => FileName.create(undefined as unknown as string)).toThrow(
      InvalidFileError,
    );
  });

  describe('getExtension', () => {
    it('should return the correct extension', () => {
      expect(FileName.create('document.pdf').getExtension()).toBe('pdf');
      expect(FileName.create('IMAGE.JPG').getExtension()).toBe('jpg');
      expect(FileName.create('archive.tar.gz').getExtension()).toBe('gz');
    });

    it('should return empty string if no extension exists', () => {
      expect(FileName.create('readme').getExtension()).toBe('');
      expect(FileName.create('.gitignore').getExtension()).toBe('');
    });
  });
});
