import { DomainError } from '@/shared/domain/errors/domain.error';

export class AccountNotVerifiedError extends DomainError {
  constructor() {
    super(
      'ACCOUNT_NOT_VERIFIED',
      'Email not verified. Please verify your email before logging in.',
    );
  }
}
