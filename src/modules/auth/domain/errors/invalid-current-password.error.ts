import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidCurrentPasswordError extends DomainError {
  constructor() {
    super('Current password is incorrect');
  }
}
