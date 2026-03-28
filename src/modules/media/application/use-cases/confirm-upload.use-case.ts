import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { MediaFile } from '../../domain/entities/media-file.entity';
import { FileUploadedDomainEvent } from '../../domain/events/file-uploaded.domain-event';
import { MediaRepository } from '../../domain/ports/media-repository.port';
import { StorageProvider } from '../../domain/ports/storage-provider.port';
import { FileName } from '../../domain/value-objects/file-name.vo';
import { MimeType } from '../../domain/value-objects/mime-type.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';

import { InvalidUploadStrategyError } from '../../domain/errors/invalid-upload-strategy.error';
import {
  MEDIA_UPLOAD_STRATEGY,
  type MediaUploadStrategy,
} from '../../domain/types/media-upload-strategy';

export interface ConfirmUploadCommand {
  fileId: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  ownerId: string;
}

export interface ConfirmUploadResult {
  id: string;
  key: string;
  publicUrl: string;
  mimeType: string;
  size: number;
  ownerId: string;
}

export class ConfirmUploadUseCase {
  constructor(
    private readonly storageProvider: StorageProvider,
    private readonly mediaRepository: MediaRepository,
    private readonly eventBus: IEventBus,
    private readonly uploadStrategy: MediaUploadStrategy,
  ) {}

  async execute(command: ConfirmUploadCommand): Promise<ConfirmUploadResult> {
    if (this.uploadStrategy !== MEDIA_UPLOAD_STRATEGY.PRESIGNED) {
      throw new InvalidUploadStrategyError(
        'Presigned upload confirmation is not available in the current configuration',
      );
    }

    FileName.create(command.originalName);
    MimeType.create(command.mimeType);
    FileSize.create(command.size);

    const publicUrl = this.storageProvider.getPublicUrl(command.key);

    const mediaFile = MediaFile.create(
      command.fileId,
      command.key,
      command.originalName,
      command.mimeType,
      command.size,
      command.ownerId,
      publicUrl,
    );

    await this.mediaRepository.save(mediaFile);

    this.eventBus.publish(
      new FileUploadedDomainEvent(
        mediaFile.id,
        mediaFile.ownerId,
        mediaFile.key.value,
        mediaFile.publicUrl,
      ),
    );

    return {
      id: mediaFile.id,
      key: mediaFile.key.value,
      publicUrl: mediaFile.publicUrl,
      mimeType: mediaFile.mimeType.value,
      size: mediaFile.size.value,
      ownerId: mediaFile.ownerId,
    };
  }
}
