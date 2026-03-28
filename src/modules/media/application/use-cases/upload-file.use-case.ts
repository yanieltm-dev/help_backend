import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { MediaFile } from '../../domain/entities/media-file.entity';
import { FileUploadedDomainEvent } from '../../domain/events/file-uploaded.domain-event';
import { MediaRepository } from '../../domain/ports/media-repository.port';
import { StorageProvider } from '../../domain/ports/storage-provider.port';
import { FileKeyGenerator } from '../../domain/services/file-key-generator.service';
import { FileValidator } from '../../domain/services/file-validator.service';
import { FileName } from '../../domain/value-objects/file-name.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';
import { MimeType } from '../../domain/value-objects/mime-type.vo';

import { InvalidUploadStrategyError } from '../../domain/errors/invalid-upload-strategy.error';
import {
  MEDIA_UPLOAD_STRATEGY,
  type MediaUploadStrategy,
} from '../../domain/types/media-upload-strategy';

export interface UploadFileCommand {
  file: Buffer;
  originalName: string;
  mimeType: string;
  ownerId: string;
}

export interface UploadFileResult {
  id: string;
  key: string;
  publicUrl: string;
  mimeType: string;
  size: number;
  ownerId: string;
}

export class UploadFileUseCase {
  constructor(
    private readonly storageProvider: StorageProvider,
    private readonly mediaRepository: MediaRepository,
    private readonly idGenerator: IIdGenerator,
    private readonly fileKeyGenerator: FileKeyGenerator,
    private readonly fileValidator: FileValidator,
    private readonly eventBus: IEventBus,
    private readonly uploadStrategy: MediaUploadStrategy,
  ) {}

  async execute(command: UploadFileCommand): Promise<UploadFileResult> {
    if (this.uploadStrategy === MEDIA_UPLOAD_STRATEGY.PRESIGNED) {
      throw new InvalidUploadStrategyError(
        'Direct upload is not available in the current configuration',
      );
    }

    // These VOs throw InvalidFileError if validation fails (early return)
    const originalName = FileName.create(command.originalName);
    const fileSize = FileSize.create(command.file.length);
    const mimeType = MimeType.create(command.mimeType);

    // Domain service validation for business rules (max size, allowed types)
    this.fileValidator.validateAll({
      fileName: originalName.value,
      mimeType: mimeType.value,
      fileSize: fileSize.value,
    });

    const fileId = this.idGenerator.generate();
    const key = this.fileKeyGenerator.execute({
      fileId,
      originalName: originalName.value,
      mimeType: mimeType.value,
    });

    const uploadResult = await this.storageProvider.upload({
      key,
      buffer: command.file,
      mimeType: mimeType.value,
      size: fileSize.value,
      metadata: {
        originalName: originalName.value,
        ownerId: command.ownerId,
      },
    });

    const mediaFile = MediaFile.create(
      fileId,
      key,
      originalName.value,
      mimeType.value,
      fileSize.value,
      command.ownerId,
      uploadResult.publicUrl,
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
