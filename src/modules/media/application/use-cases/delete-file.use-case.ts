import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { FileNotFoundError } from '../../domain/errors/file-not-found.error';
import { UnauthorizedFileAccessError } from '../../domain/errors/unauthorized-file-access.error';
import { FileDeletedDomainEvent } from '../../domain/events/file-deleted.domain-event';
import type { MediaRepository } from '../../domain/ports/media-repository.port';
import { StorageProvider } from '../../domain/ports/storage-provider.port';

export interface DeleteFileCommand {
  fileId: string;
  requesterId: string;
}

export class DeleteFileUseCase {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly storageProvider: StorageProvider,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: DeleteFileCommand): Promise<void> {
    const mediaFile = await this.mediaRepository.findById(command.fileId);

    if (!mediaFile) {
      throw new FileNotFoundError(command.fileId);
    }

    if (!mediaFile.isOwnedBy(command.requesterId)) {
      throw new UnauthorizedFileAccessError(
        command.requesterId,
        command.fileId,
      );
    }

    await this.storageProvider.delete(mediaFile.key.value);
    await this.mediaRepository.delete(mediaFile.id);

    this.eventBus.publish(
      new FileDeletedDomainEvent(mediaFile.id, mediaFile.ownerId),
    );
  }
}
