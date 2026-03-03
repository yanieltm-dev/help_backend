import { HttpStatus } from '@nestjs/common';
import { UserAlreadyExistsError } from '@/modules/auth/domain/errors/user-already-exists.error';
import {
  InvalidOtpError,
  ExpiredOtpError,
  MaxAttemptsExceededError,
} from '@/modules/auth/domain/errors/otp.errors';
import { AccountLockedError } from '@/modules/auth/domain/errors/account-locked.error';
import { AccountNotVerifiedError } from '@/modules/auth/domain/errors/account-not-verified.error';
import { InvalidCredentialsError } from '@/modules/auth/domain/errors/invalid-credentials.error';
import { DomainError } from '@/shared/domain/errors/domain.error';

export interface ErrorMapping {
  status: HttpStatus;
  error: string;
}

type DomainErrorConstructor = new (...args: any[]) => DomainError;

const errorMap = new Map<DomainErrorConstructor, ErrorMapping>();

// Register Domain Errors mappings here
errorMap.set(UserAlreadyExistsError as DomainErrorConstructor, {
  status: HttpStatus.CONFLICT,
  error: 'Conflict',
});

errorMap.set(InvalidOtpError as DomainErrorConstructor, {
  status: HttpStatus.BAD_REQUEST,
  error: 'Bad Request',
});

errorMap.set(ExpiredOtpError as DomainErrorConstructor, {
  status: HttpStatus.BAD_REQUEST,
  error: 'Bad Request',
});

errorMap.set(MaxAttemptsExceededError as DomainErrorConstructor, {
  status: HttpStatus.BAD_REQUEST,
  error: 'Bad Request',
});

errorMap.set(AccountLockedError as DomainErrorConstructor, {
  status: HttpStatus.FORBIDDEN,
  error: 'Forbidden',
});

errorMap.set(AccountNotVerifiedError as DomainErrorConstructor, {
  status: HttpStatus.FORBIDDEN,
  error: 'Forbidden',
});

errorMap.set(InvalidCredentialsError as DomainErrorConstructor, {
  status: HttpStatus.UNAUTHORIZED,
  error: 'Unauthorized',
});

export function mapDomainError(error: DomainError): ErrorMapping | null {
  return errorMap.get(error.constructor as DomainErrorConstructor) || null;
}
