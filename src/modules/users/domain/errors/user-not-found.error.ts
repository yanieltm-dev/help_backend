import { DomainError } from '@/shared/domain/errors/domain.error';

export class UserNotFoundError extends DomainError {
  constructor() {
    super('USER_NOT_FOUND', 'User not found');
  }
}
