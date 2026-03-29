import { HttpStatus } from '@nestjs/common';
import { DomainErrorMapperRegistry } from '@/core/filters/domain-error-registry';
import { UserAlreadyExistsError } from '../../../domain/errors/user-already-exists.error';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

export function registerUsersDomainErrors() {
  DomainErrorMapperRegistry.register(UserAlreadyExistsError, {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
  });

  DomainErrorMapperRegistry.register(UserNotFoundError, {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
  });
}
