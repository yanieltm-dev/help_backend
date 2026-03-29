import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { StorageProvider } from '../../domain/ports/storage-provider.port';
import { FileKeyGenerator } from '../../domain/services/file-key-generator.service';
import { FileValidator } from '../../domain/services/file-validator.service';

import { InvalidUploadStrategyError } from '../../domain/errors/invalid-upload-strategy.error';
import { StorageProviderError } from '../../domain/errors/storage-provider.error';
import {
  MEDIA_UPLOAD_STRATEGY,
  type MediaUploadStrategy,
} from '../../domain/types/media-upload-strategy';

export interface GeneratePresignedUrlCommand {
  fileId?: string;
  originalName: string;
  mimeType: string;
  size: number;
  ownerId: string;
}

export interface GeneratePresignedUrlResult {
  id: string;
  key: string;
  uploadUrl: string;
}

export class GeneratePresignedUrlUseCase {
  constructor(
    private readonly storageProvider: StorageProvider,
    private readonly idGenerator: IIdGenerator,
    private readonly fileKeyGenerator: FileKeyGenerator,
    private readonly fileValidator: FileValidator,
    private readonly presignedUrlExpiry: number,
    private readonly uploadStrategy: MediaUploadStrategy,
  ) {}

  async execute(
    command: GeneratePresignedUrlCommand,
  ): Promise<GeneratePresignedUrlResult> {
    if (this.uploadStrategy !== MEDIA_UPLOAD_STRATEGY.PRESIGNED) {
      throw new InvalidUploadStrategyError(
        'Presigned upload is not available in the current configuration',
      );
    }

    // Validate file metadata before generating URL
    this.fileValidator.validateAll({
      fileName: command.originalName,
      mimeType: command.mimeType,
      fileSize: command.size,
    });

    if (!this.storageProvider.supportsPresignedUrls()) {
      throw new StorageProviderError(
        'Storage provider does not support presigned URLs',
        'unknown',
      );
    }

    const fileId = command.fileId || this.idGenerator.generate();
    const key = this.fileKeyGenerator.execute({
      fileId,
      originalName: command.originalName,
      mimeType: command.mimeType,
    });

    const uploadUrl = await this.storageProvider.getPresignedUrl({
      key,
      operation: 'write',
      expiresInSeconds: this.presignedUrlExpiry,
    });

    return {
      id: fileId,
      key,
      uploadUrl,
    };
  }
}
