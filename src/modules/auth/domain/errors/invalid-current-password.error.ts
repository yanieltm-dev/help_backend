import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidCurrentPasswordError extends DomainError {
  constructor() {
    super('INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
  }
}
