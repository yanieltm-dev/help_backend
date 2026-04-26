import { DomainErrorMapperRegistry } from '@/core/filters/domain-error-registry';
import { HttpStatus } from '@nestjs/common';
import { FileNotFoundError } from '../../../domain/errors/file-not-found.error';
import { InvalidFileError } from '../../../domain/errors/invalid-file.error';
import { StorageProviderError } from '../../../domain/errors/storage-provider.error';
import { UnauthorizedFileAccessError } from '../../../domain/errors/unauthorized-file-access.error';

import { InvalidUploadStrategyError } from '../../../domain/errors/invalid-upload-strategy.error';

export function registerMediaDomainErrors() {
  DomainErrorMapperRegistry.register(FileNotFoundError, {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
  });

  DomainErrorMapperRegistry.register(UnauthorizedFileAccessError, {
    status: HttpStatus.FORBIDDEN,
    error: 'Forbidden',
  });

  DomainErrorMapperRegistry.register(InvalidFileError, {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    error: 'Unprocessable Entity',
  });

  DomainErrorMapperRegistry.register(StorageProviderError, {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    error: 'Service Unavailable',
  });

  DomainErrorMapperRegistry.register(InvalidUploadStrategyError, {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
  });
}
