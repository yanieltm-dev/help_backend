/* eslint-disable @typescript-eslint/unbound-method */
import { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { StorageProvider } from '../../domain/ports/storage-provider.port';
import { FileKeyGenerator } from '../../domain/services/file-key-generator.service';
import { FileValidator } from '../../domain/services/file-validator.service';
import {
  GeneratePresignedUrlCommand,
  GeneratePresignedUrlUseCase,
} from './generate-presigned-url.use-case';

describe('GeneratePresignedUrlUseCase', () => {
  let useCase: GeneratePresignedUrlUseCase;
  let mockStorageProvider: jest.Mocked<StorageProvider>;
  let mockIdGenerator: jest.Mocked<IIdGenerator>;
  let mockFileKeyGenerator: jest.Mocked<FileKeyGenerator>;
  let mockFileValidator: jest.Mocked<FileValidator>;
  const presignedUrlExpiry = 3600;

  beforeEach(() => {
    mockStorageProvider = {
      getPresignedUrl: jest.fn(),
      supportsPresignedUrls: jest.fn(),
    } as unknown as jest.Mocked<StorageProvider>;

    mockIdGenerator = {
      generate: jest.fn(),
    } as unknown as jest.Mocked<IIdGenerator>;

    mockFileKeyGenerator = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FileKeyGenerator>;

    mockFileValidator = {
      validateAll: jest.fn(),
    } as unknown as jest.Mocked<FileValidator>;

    useCase = new GeneratePresignedUrlUseCase(
      mockStorageProvider,
      mockIdGenerator,
      mockFileKeyGenerator,
      mockFileValidator,
      presignedUrlExpiry,
      'presigned',
    );
  });

  it('should successfully generate a presigned url', async () => {
    // Arrange
    const command: GeneratePresignedUrlCommand = {
      originalName: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      ownerId: 'user-123',
    };

    const fileId = 'generated-id';
    const key = 'media/images/generated-id-test.jpg';
    const uploadUrl = 'https://storage.example.com/upload-here';

    mockFileValidator.validateAll.mockImplementation(() => {});
    mockStorageProvider.supportsPresignedUrls.mockReturnValue(true);
    mockIdGenerator.generate.mockReturnValue(fileId);
    mockFileKeyGenerator.execute.mockReturnValue(key);
    mockStorageProvider.getPresignedUrl.mockResolvedValue(uploadUrl);

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result).toEqual({
      id: fileId,
      key,
      uploadUrl,
    });

    expect(mockFileValidator.validateAll).toHaveBeenCalledWith({
      fileName: command.originalName,
      mimeType: command.mimeType,
      fileSize: command.size,
    });

    expect(mockStorageProvider.supportsPresignedUrls).toHaveBeenCalled();
    expect(mockIdGenerator.generate).toHaveBeenCalled();
    expect(mockFileKeyGenerator.execute).toHaveBeenCalledWith({
      fileId,
      originalName: command.originalName,
      mimeType: command.mimeType,
    });

    expect(mockStorageProvider.getPresignedUrl).toHaveBeenCalledWith({
      key,
      operation: 'write',
      expiresInSeconds: presignedUrlExpiry,
    });
  });

  it('should throw InvalidUploadStrategyError when strategy is direct', async () => {
    // Arrange
    const directUseCase = new GeneratePresignedUrlUseCase(
      mockStorageProvider,
      mockIdGenerator,
      mockFileKeyGenerator,
      mockFileValidator,
      presignedUrlExpiry,
      'direct',
    );

    const command: GeneratePresignedUrlCommand = {
      originalName: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      ownerId: 'user-123',
    };

    // Act & Assert
    await expect(directUseCase.execute(command)).rejects.toThrow(
      'Presigned upload is not available in the current configuration',
    );
  });

  it('should throw if validation fails', async () => {
    // Arrange
    const command: GeneratePresignedUrlCommand = {
      originalName: 'test.exe',
      mimeType: 'application/x-msdownload',
      size: 1024,
      ownerId: 'user-123',
    };

    mockFileValidator.validateAll.mockImplementation(() => {
      throw new Error('Invalid file');
    });

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow('Invalid file');
    expect(mockStorageProvider.getPresignedUrl).not.toHaveBeenCalled();
  });

  it('should throw if storage provider does not support presigned urls', async () => {
    // Arrange
    const command: GeneratePresignedUrlCommand = {
      originalName: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      ownerId: 'user-123',
    };

    mockStorageProvider.supportsPresignedUrls.mockReturnValue(false);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(
      'Storage provider does not support presigned URLs',
    );
  });
});
