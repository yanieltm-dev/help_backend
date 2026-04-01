import { HttpStatus } from '@nestjs/common';
import { DomainErrorMapperRegistry } from '@/core/filters/domain-error-registry';
import { EmailAlreadyExistsError } from '../../../domain/errors/email-already-exists.error';
import { UsernameAlreadyExistsError } from '../../../domain/errors/username-already-exists.error';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';

export function registerUsersDomainErrors() {
  DomainErrorMapperRegistry.register(EmailAlreadyExistsError, {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
  });

  DomainErrorMapperRegistry.register(UsernameAlreadyExistsError, {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
  });

  DomainErrorMapperRegistry.register(UserNotFoundError, {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
  });
}
