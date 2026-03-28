/* eslint-disable @typescript-eslint/unbound-method */
import { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { FileUploadedDomainEvent } from '../../domain/events/file-uploaded.domain-event';
import { MediaRepository } from '../../domain/ports/media-repository.port';
import { StorageProvider } from '../../domain/ports/storage-provider.port';
import { FileKeyGenerator } from '../../domain/services/file-key-generator.service';
import { FileValidator } from '../../domain/services/file-validator.service';
import { UploadFileCommand, UploadFileUseCase } from './upload-file.use-case';

describe('UploadFileUseCase', () => {
  let useCase: UploadFileUseCase;
  let mockStorageProvider: jest.Mocked<StorageProvider>;
  let mockMediaRepository: jest.Mocked<MediaRepository>;
  let mockIdGenerator: jest.Mocked<IIdGenerator>;
  let mockFileKeyGenerator: jest.Mocked<FileKeyGenerator>;
  let mockFileValidator: jest.Mocked<FileValidator>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockStorageProvider = {
      upload: jest.fn(),
      delete: jest.fn(),
      getPublicUrl: jest.fn(),
      getPresignedUrl: jest.fn(),
      supportsPresignedUrls: jest.fn(),
    } as unknown as jest.Mocked<StorageProvider>;

    mockMediaRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      findByOwnerId: jest.fn(),
    } as unknown as jest.Mocked<MediaRepository>;

    mockIdGenerator = {
      generate: jest.fn(),
    } as unknown as jest.Mocked<IIdGenerator>;

    mockFileKeyGenerator = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FileKeyGenerator>;

    mockFileValidator = {
      validateAll: jest.fn(),
    } as unknown as jest.Mocked<FileValidator>;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    } as unknown as jest.Mocked<IEventBus>;

    useCase = new UploadFileUseCase(
      mockStorageProvider,
      mockMediaRepository,
      mockIdGenerator,
      mockFileKeyGenerator,
      mockFileValidator,
      mockEventBus,
      'direct',
    );
  });

  it('should successfully upload a file and publish an event', async () => {
    // Arrange
    const command: UploadFileCommand = {
      file: Buffer.from('test content'),
      originalName: 'test.jpg',
      mimeType: 'image/jpeg',
      ownerId: 'user-123',
    };

    const fileId = 'generated-id';
    const key = 'media/images/generated-id-test.jpg';
    const publicUrl =
      'https://storage.example.com/media/images/generated-id-test.jpg';

    mockIdGenerator.generate.mockReturnValue(fileId);
    mockFileKeyGenerator.execute.mockReturnValue(key);
    mockStorageProvider.upload.mockResolvedValue({
      key,
      publicUrl,
    });

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result).toEqual({
      id: fileId,
      key,
      publicUrl,
      mimeType: command.mimeType,
      size: command.file.length,
      ownerId: command.ownerId,
    });

    expect(mockFileValidator.validateAll).toHaveBeenCalledWith({
      fileName: command.originalName,
      mimeType: command.mimeType,
      fileSize: command.file.length,
    });

    expect(mockFileKeyGenerator.execute).toHaveBeenCalledWith({
      fileId,
      originalName: command.originalName,
      mimeType: command.mimeType,
    });

    expect(mockStorageProvider.upload).toHaveBeenCalledWith({
      key,
      buffer: command.file,
      mimeType: command.mimeType,
      size: command.file.length,
      metadata: {
        originalName: command.originalName,
        ownerId: command.ownerId,
      },
    });

    expect(mockMediaRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(FileUploadedDomainEvent),
    );
  });

  it('should throw an error if file validation fails', async () => {
    // Arrange
    const command: UploadFileCommand = {
      file: Buffer.from('test content'),
      originalName: 'test.exe',
      mimeType: 'application/x-msdownload',
      ownerId: 'user-123',
    };

    const validationError = new Error('Invalid file type');
    mockFileValidator.validateAll.mockImplementation(() => {
      throw validationError;
    });

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(validationError);
    expect(mockStorageProvider.upload).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw InvalidUploadStrategyError when strategy is presigned', async () => {
    // Arrange
    const presignedUseCase = new UploadFileUseCase(
      mockStorageProvider,
      mockMediaRepository,
      mockIdGenerator,
      mockFileKeyGenerator,
      mockFileValidator,
      mockEventBus,
      'presigned',
    );

    const command: UploadFileCommand = {
      file: Buffer.from('test'),
      originalName: 'test.jpg',
      mimeType: 'image/jpeg',
      ownerId: 'owner-id',
    };

    // Act & Assert
    await expect(presignedUseCase.execute(command)).rejects.toThrow(
      'Direct upload is not available in the current configuration',
    );
  });
});
