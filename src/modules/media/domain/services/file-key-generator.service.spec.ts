import { FileKeyGenerator } from './file-key-generator.service';

describe('FileKeyGenerator', () => {
  let service: FileKeyGenerator;

  beforeEach(() => {
    service = new FileKeyGenerator();
  });

  it('should generate a key in media/images for image mime types', () => {
    const params = {
      fileId: 'uuid-123',
      originalName: 'avatar.png',
      mimeType: 'image/png',
    };

    const result = service.execute(params);

    expect(result).toBe('media/images/uuid-123-avatar.png');
  });

  it('should generate a key in media/videos for video mime types', () => {
    const params = {
      fileId: 'uuid-456',
      originalName: 'clip.mp4',
      mimeType: 'video/mp4',
    };

    const result = service.execute(params);

    expect(result).toBe('media/videos/uuid-456-clip.mp4');
  });

  it('should generate a key in media/documents for application/pdf', () => {
    const params = {
      fileId: 'uuid-789',
      originalName: 'report.pdf',
      mimeType: 'application/pdf',
    };

    const result = service.execute(params);

    expect(result).toBe('media/documents/uuid-789-report.pdf');
  });

  it('should generate a key in media/documents for text mime types', () => {
    const params = {
      fileId: 'uuid-abc',
      originalName: 'info.txt',
      mimeType: 'text/plain',
    };

    const result = service.execute(params);

    expect(result).toBe('media/documents/uuid-abc-info.txt');
  });

  it('should generate a key in media/others for unknown mime types', () => {
    const params = {
      fileId: 'uuid-xyz',
      originalName: 'data.bin',
      mimeType: 'application/octet-stream',
    };

    const result = service.execute(params);

    expect(result).toBe('media/others/uuid-xyz-data.bin');
  });

  it('should sanitize the original name', () => {
    const params = {
      fileId: 'uuid-123',
      originalName: 'My Awesome Photo!.jpg',
      mimeType: 'image/jpeg',
    };

    const result = service.execute(params);

    expect(result).toBe('media/images/uuid-123-my-awesome-photo-.jpg');
  });
});
