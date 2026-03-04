import { DomainError } from '@/shared/domain/errors/domain.error';

export class EmailAlreadyVerifiedError extends DomainError {
  constructor() {
    super('Email already verified');
  }
}
