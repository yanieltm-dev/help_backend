import { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { MediaFile } from '../../domain/entities/media-file.entity';
import { FileNotFoundError } from '../../domain/errors/file-not-found.error';
import { UnauthorizedFileAccessError } from '../../domain/errors/unauthorized-file-access.error';
import { FileDeletedDomainEvent } from '../../domain/events/file-deleted.domain-event';
import { MediaRepository } from '../../domain/ports/media-repository.port';
import { StorageProvider } from '../../domain/ports/storage-provider.port';
import { DeleteFileCommand, DeleteFileUseCase } from './delete-file.use-case';

describe('DeleteFileUseCase', () => {
  let useCase: DeleteFileUseCase;
  let mockMediaRepository: jest.Mocked<MediaRepository>;
  let mockStorageProvider: jest.Mocked<StorageProvider>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockMediaRepository = {
      findById: jest.fn(),
      findByOwnerId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<MediaRepository>;

    mockStorageProvider = {
      upload: jest.fn(),
      delete: jest.fn(),
      getPublicUrl: jest.fn(),
      getPresignedUrl: jest.fn(),
      supportsPresignedUrls: jest.fn(),
    } as unknown as jest.Mocked<StorageProvider>;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    } as unknown as jest.Mocked<IEventBus>;

    useCase = new DeleteFileUseCase(
      mockMediaRepository,
      mockStorageProvider,
      mockEventBus,
    );
  });

  it('should successfully delete a file and publish an event', async () => {
    // Arrange
    const command: DeleteFileCommand = {
      fileId: 'file-123',
      requesterId: 'user-123',
    };

    const mediaFile = MediaFile.create(
      'file-123',
      'key-123',
      'test.jpg',
      'image/jpeg',
      100,
      'user-123',
      'https://url.com',
    );

    mockMediaRepository.findById.mockResolvedValue(mediaFile);
    mockStorageProvider.delete.mockResolvedValue(undefined);

    // Act
    await useCase.execute(command);

    // Assert
    expect(mockMediaRepository.findById).toHaveBeenCalledWith(command.fileId);
    expect(mockStorageProvider.delete).toHaveBeenCalledWith(
      mediaFile.key.value,
    );
    expect(mockMediaRepository.delete).toHaveBeenCalledWith(mediaFile.id);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(FileDeletedDomainEvent),
    );

    const publishedEvent = (
      mockEventBus.publish as unknown as jest.Mock<
        void,
        [FileDeletedDomainEvent]
      >
    ).mock.calls[0][0];
    expect(publishedEvent.fileId).toBe(command.fileId);
    expect(publishedEvent.ownerId).toBe(command.requesterId);
  });

  it('should throw FileNotFoundError if file does not exist', async () => {
    // Arrange
    const command: DeleteFileCommand = {
      fileId: 'non-existent',
      requesterId: 'user-123',
    };

    mockMediaRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(FileNotFoundError);
    expect(mockStorageProvider.delete).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedFileAccessError if file is not owned by requester', async () => {
    // Arrange
    const command: DeleteFileCommand = {
      fileId: 'file-123',
      requesterId: 'wrong-user',
    };

    const mediaFile = MediaFile.create(
      'file-123',
      'key-123',
      'test.jpg',
      'image/jpeg',
      100,
      'original-owner',
      'https://url.com',
    );

    mockMediaRepository.findById.mockResolvedValue(mediaFile);

    // Act & Assert
    await expect(useCase.execute(command)).rejects.toThrow(
      UnauthorizedFileAccessError,
    );
    expect(mockStorageProvider.delete).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
