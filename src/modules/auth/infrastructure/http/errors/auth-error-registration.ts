import { HttpStatus } from '@nestjs/common';
import { DomainErrorMapperRegistry } from '@/core/filters/domain-error-registry';
import {
  InvalidOtpError,
  ExpiredOtpError,
  MaxAttemptsExceededError,
} from '../../../domain/errors/otp.errors';
import { AccountLockedError } from '../../../domain/errors/account-locked.error';
import { AccountNotVerifiedError } from '../../../domain/errors/account-not-verified.error';
import { InvalidCredentialsError } from '../../../domain/errors/invalid-credentials.error';
import { EmailAlreadyVerifiedError } from '../../../domain/errors/email-already-verified.error';
import { InvalidRefreshTokenError } from '../../../domain/errors/invalid-refresh-token.error';
import { InvalidCurrentPasswordError } from '../../../domain/errors/invalid-current-password.error';
import { InvalidNewPasswordError } from '../../../domain/errors/invalid-new-password.error';
import {
  ExpiredChangePasswordTokenError,
  InvalidChangePasswordTokenError,
} from '../../../domain/errors/change-password-token.errors';

export function registerAuthDomainErrors() {
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

  DomainErrorMapperRegistry.register(InvalidChangePasswordTokenError, {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
  });

  DomainErrorMapperRegistry.register(ExpiredChangePasswordTokenError, {
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

  DomainErrorMapperRegistry.register(InvalidCurrentPasswordError, {
    status: HttpStatus.UNAUTHORIZED,
    error: 'Unauthorized',
  });

  DomainErrorMapperRegistry.register(InvalidNewPasswordError, {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    error: 'Unprocessable Entity',
  });

  DomainErrorMapperRegistry.register(EmailAlreadyVerifiedError, {
    status: HttpStatus.BAD_REQUEST,
    error: 'Bad Request',
  });
}
