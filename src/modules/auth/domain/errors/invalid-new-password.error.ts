import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidNewPasswordError extends DomainError {
  constructor(message: string) {
    super('INVALID_NEW_PASSWORD', message);
  }
}
