import { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { FileUploadedDomainEvent } from '../../domain/events/file-uploaded.domain-event';
import { MediaRepository } from '../../domain/ports/media-repository.port';
import { StorageProvider } from '../../domain/ports/storage-provider.port';
import {
  ConfirmUploadCommand,
  ConfirmUploadUseCase,
} from './confirm-upload.use-case';

describe('ConfirmUploadUseCase', () => {
  let useCase: ConfirmUploadUseCase;
  let mockStorageProvider: jest.Mocked<StorageProvider>;
  let mockMediaRepository: jest.Mocked<MediaRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockStorageProvider = {
      getPublicUrl: jest.fn(),
      exists: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<StorageProvider>;

    mockMediaRepository = {
      save: jest.fn(),
    } as unknown as jest.Mocked<MediaRepository>;

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    } as unknown as jest.Mocked<IEventBus>;

    useCase = new ConfirmUploadUseCase(
      mockStorageProvider,
      mockMediaRepository,
      mockEventBus,
      'presigned',
    );
  });

  it('should successfully confirm an upload and publish an event', async () => {
    // Arrange
    const command: ConfirmUploadCommand = {
      fileId: 'file-123',
      key: 'uploads/file-123-test.jpg',
      originalName: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      ownerId: 'user-456',
    };

    const publicUrl = 'https://storage.example.com/uploads/file-123-test.jpg';
    mockStorageProvider.getPublicUrl.mockReturnValue(publicUrl);

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result).toEqual({
      id: command.fileId,
      key: command.key,
      publicUrl,
      mimeType: command.mimeType,
      size: command.size,
      ownerId: command.ownerId,
    });

    expect(mockStorageProvider.getPublicUrl).toHaveBeenCalledWith(command.key);
    expect(mockMediaRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.any(FileUploadedDomainEvent),
    );

    const publishedEvent = (
      mockEventBus.publish as unknown as jest.Mock<
        void,
        [FileUploadedDomainEvent]
      >
    ).mock.calls[0][0];
    expect(publishedEvent.fileId).toBe(command.fileId);
    expect(publishedEvent.ownerId).toBe(command.ownerId);
    expect(publishedEvent.key).toBe(command.key);
    expect(publishedEvent.publicUrl).toBe(publicUrl);
  });

  it('should throw InvalidUploadStrategyError when strategy is direct', async () => {
    // Arrange
    const directUseCase = new ConfirmUploadUseCase(
      mockStorageProvider,
      mockMediaRepository,
      mockEventBus,
      'direct',
    );

    const command: ConfirmUploadCommand = {
      fileId: 'file-123',
      key: 'uploads/file-123-test.jpg',
      originalName: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      ownerId: 'user-456',
    };

    // Act & Assert
    await expect(directUseCase.execute(command)).rejects.toThrow(
      'Presigned upload confirmation is not available in the current configuration',
    );
  });
});
