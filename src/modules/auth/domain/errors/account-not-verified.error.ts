import { DomainError } from '@/shared/domain/errors/domain.error';

export class AccountNotVerifiedError extends DomainError {
  constructor() {
    super('Email not verified. Please verify your email before logging in.');
  }
}
