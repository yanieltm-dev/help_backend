import { DomainError } from '@/shared/domain/errors/domain.error';

export class AccountLockedError extends DomainError {
  constructor(lockedUntil?: Date) {
    const message = lockedUntil
      ? `Account is locked until ${lockedUntil.toISOString()}`
      : 'Account is locked';
    super(message);
  }
}
