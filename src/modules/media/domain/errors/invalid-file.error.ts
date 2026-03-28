import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidFileError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
