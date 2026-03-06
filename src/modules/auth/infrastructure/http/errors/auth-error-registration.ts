import { HttpStatus } from '@nestjs/common';
import { DomainErrorMapperRegistry } from '@/core/filters/domain-error-registry';
import { UserAlreadyExistsError } from '../../../domain/errors/user-already-exists.error';
import {
  InvalidOtpError,
  ExpiredOtpError,
  MaxAttemptsExceededError,
} from '../../../domain/errors/otp.errors';
import { AccountLockedError } from '../../../domain/errors/account-locked.error';
import { AccountNotVerifiedError } from '../../../domain/errors/account-not-verified.error';
import { InvalidCredentialsError } from '../../../domain/errors/invalid-credentials.error';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';
import { EmailAlreadyVerifiedError } from '../../../domain/errors/email-already-verified.error';
import { InvalidRefreshTokenError } from '../../../domain/errors/invalid-refresh-token.error';

export function registerAuthDomainErrors() {
  DomainErrorMapperRegistry.register(UserAlreadyExistsError, {
    status: HttpStatus.CONFLICT,
    error: 'Conflict',
  });

  DomainErrorMapperRegistry.register(InvalidOtpError, {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
  });

  DomainErrorMapperRegistry.register(ExpiredOtpError, {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
  });

  DomainErrorMapperRegistry.register(MaxAttemptsExceededError, {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
  });

  DomainErrorMapperRegistry.register(AccountLockedError, {
    status: HttpStatus.FORBIDDEN,
    error: 'Forbidden',
  });

  DomainErrorMapperRegistry.register(AccountNotVerifiedError, {
    status: HttpStatus.FORBIDDEN,
    error: 'Forbidden',
  });

  DomainErrorMapperRegistry.register(InvalidCredentialsError, {
    status: HttpStatus.UNAUTHORIZED,
    error: 'Unauthorized',
  });

  DomainErrorMapperRegistry.register(InvalidRefreshTokenError, {
    status: HttpStatus.UNAUTHORIZED,
    error: 'Unauthorized',
  });

  DomainErrorMapperRegistry.register(UserNotFoundError, {
    status: HttpStatus.NOT_FOUND,
    error: 'Not Found',
  });

  DomainErrorMapperRegistry.register(EmailAlreadyVerifiedError, {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
  });
}
