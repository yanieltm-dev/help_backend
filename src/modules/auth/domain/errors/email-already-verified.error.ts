import { DomainError } from '@/shared/domain/errors/domain.error';

export class EmailAlreadyVerifiedError extends DomainError {
  constructor() {
    super('EMAIL_ALREADY_VERIFIED', 'Email already verified');
  }
}
