import { DomainError } from '@/shared/domain/errors/domain.error';

export class UserAlreadyExistsError extends DomainError {
  constructor(field: 'email' | 'username') {
    super(
      field === 'email'
        ? 'Email already registered'
        : 'Username is not available',
    );
  }
}
