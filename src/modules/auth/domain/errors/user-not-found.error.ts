import { DomainError } from '@/shared/domain/errors/domain.error';

export class UserNotFoundError extends DomainError {
  constructor() {
    super('User not found');
  }
}
