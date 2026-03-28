import type { AllConfigType } from '@/core/config/config.type';
import { PROVIDER } from '@/core/config/media.config';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { SharedModule } from '@/shared/shared.module';
import { EVENT_BUS, ID_GENERATOR } from '@/shared/shared.tokens';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ConfirmUploadUseCase } from './application/use-cases/confirm-upload.use-case';
import { DeleteFileUseCase } from './application/use-cases/delete-file.use-case';
import { GeneratePresignedUrlUseCase } from './application/use-cases/generate-presigned-url.use-case';
import { UploadFileUseCase } from './application/use-cases/upload-file.use-case';
import type { MediaRepository } from './domain/ports/media-repository.port';
import type { StorageProvider } from './domain/ports/storage-provider.port';
import { FileKeyGenerator } from './domain/services/file-key-generator.service';
import { FileValidator } from './domain/services/file-validator.service';
import {
  MEDIA_UPLOAD_STRATEGY,
  MediaUploadStrategy,
} from './domain/types/media-upload-strategy';
import { MediaController } from './infrastructure/http/controllers/media.controller';
import { registerMediaDomainErrors } from './infrastructure/http/errors/media-error-registration';
import { DrizzleMediaRepository } from './infrastructure/persistence/repositories/drizzle-media.repository';
import { LocalStorageProvider } from './infrastructure/storage/local-storage.provider';
import { S3StorageProvider } from './infrastructure/storage/s3-storage.provider';
import {
  MEDIA_CONFIG,
  MEDIA_REPOSITORY,
  STORAGE_PROVIDER,
} from './media.tokens';

export interface MediaModuleConfig {
  presignedUrlExpiry: number;
  uploadStrategy: MediaUploadStrategy;
}

@Module({
  imports: [ConfigModule, SharedModule],
  controllers: [MediaController],
  providers: [
    {
      provide: FileValidator,
      useFactory: (configService: ConfigService<AllConfigType>) =>
        new FileValidator({
          maxFileSize:
            configService.get('media.maxFileSize', { infer: true }) ?? 10485760,
          allowedMimeTypes: configService.get('media.allowedMimeTypes', {
            infer: true,
          }) ?? ['image/*', 'video/*', 'application/pdf'],
        }),
      inject: [ConfigService],
    },
    {
      provide: FileKeyGenerator,
      useClass: FileKeyGenerator,
    },
    {
      provide: UploadFileUseCase,
      useFactory: (
        storageProvider: StorageProvider,
        mediaRepository: MediaRepository,
        idGenerator: IIdGenerator,
        fileKeyGenerator: FileKeyGenerator,
        fileValidator: FileValidator,
        eventBus: IEventBus,
        config: MediaModuleConfig,
      ) =>
        new UploadFileUseCase(
          storageProvider,
          mediaRepository,
          idGenerator,
          fileKeyGenerator,
          fileValidator,
          eventBus,
          config.uploadStrategy,
        ),
      inject: [
        STORAGE_PROVIDER,
        MEDIA_REPOSITORY,
        ID_GENERATOR,
        FileKeyGenerator,
        FileValidator,
        EVENT_BUS,
        MEDIA_CONFIG,
      ],
    },
    {
      provide: DeleteFileUseCase,
      useFactory: (
        mediaRepository: MediaRepository,
        storageProvider: StorageProvider,
        eventBus: IEventBus,
      ) => new DeleteFileUseCase(mediaRepository, storageProvider, eventBus),
      inject: [MEDIA_REPOSITORY, STORAGE_PROVIDER, EVENT_BUS],
    },
    {
      provide: GeneratePresignedUrlUseCase,
      useFactory: (
        storageProvider: StorageProvider,
        idGenerator: IIdGenerator,
        fileKeyGenerator: FileKeyGenerator,
        fileValidator: FileValidator,
        config: MediaModuleConfig,
      ) =>
        new GeneratePresignedUrlUseCase(
          storageProvider,
          idGenerator,
          fileKeyGenerator,
          fileValidator,
          config.presignedUrlExpiry,
          config.uploadStrategy,
        ),
      inject: [
        STORAGE_PROVIDER,
        ID_GENERATOR,
        FileKeyGenerator,
        FileValidator,
        MEDIA_CONFIG,
      ],
    },
    {
      provide: ConfirmUploadUseCase,
      useFactory: (
        storageProvider: StorageProvider,
        mediaRepository: MediaRepository,
        eventBus: IEventBus,
        config: MediaModuleConfig,
      ) =>
        new ConfirmUploadUseCase(
          storageProvider,
          mediaRepository,
          eventBus,
          config.uploadStrategy,
        ),
      inject: [STORAGE_PROVIDER, MEDIA_REPOSITORY, EVENT_BUS, MEDIA_CONFIG],
    },
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const provider = configService.get('media.provider', {
          infer: true,
        });
        switch (provider) {
          case 's3':
          case 's3-presigned':
            return new S3StorageProvider(configService);
          case 'local':
          default:
            return new LocalStorageProvider(configService);
        }
      },
      inject: [ConfigService],
    },
    {
      provide: MEDIA_REPOSITORY,
      useClass: DrizzleMediaRepository,
    },
    {
      provide: MEDIA_CONFIG,
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const provider = configService.get('media.provider', {
          infer: true,
        });

        return {
          presignedUrlExpiry:
            configService.get('media.presignedUrlExpiry', { infer: true }) ??
            3600,
          uploadStrategy:
            provider === PROVIDER.S3_PRESIGNED
              ? MEDIA_UPLOAD_STRATEGY.PRESIGNED
              : MEDIA_UPLOAD_STRATEGY.DIRECT,
        };
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    UploadFileUseCase,
    DeleteFileUseCase,
    GeneratePresignedUrlUseCase,
    ConfirmUploadUseCase,
  ],
})
export class MediaModule {
  constructor() {
    registerMediaDomainErrors();
  }
}
