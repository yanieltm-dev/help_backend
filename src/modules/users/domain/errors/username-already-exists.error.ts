import { DomainError } from '@/shared/domain/errors/domain.error';

export class UsernameAlreadyExistsError extends DomainError {
  constructor() {
    super('USERNAME_ALREADY_EXISTS', 'Username is not available');
  }
}
