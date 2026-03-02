import { HttpStatus } from '@nestjs/common';
import { UserAlreadyExistsError } from '@/modules/auth/domain/errors/user-already-exists.error';
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

export function mapDomainError(error: DomainError): ErrorMapping | null {
  return errorMap.get(error.constructor as DomainErrorConstructor) || null;
}
