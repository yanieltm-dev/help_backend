import { DomainError } from '@/shared/domain/errors/domain.error';

export class EmailAlreadyExistsError extends DomainError {
  constructor() {
    super('USER_EMAIL_ALREADY_EXISTS', 'Email already registered');
  }
}
