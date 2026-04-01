import { DomainError } from '@/shared/domain/errors/domain.error';

export class AccountLockedError extends DomainError {
  constructor(lockedUntil?: Date) {
    super(
      'ACCOUNT_LOCKED',
      lockedUntil
        ? `Account is locked until ${lockedUntil.toISOString()}`
        : 'Account is locked',
    );
  }
}
