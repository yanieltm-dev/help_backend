import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid email/username or password');
  }
}
