import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidChangePasswordTokenError extends DomainError {
  constructor() {
    super('INVALID_CHANGE_PASSWORD_TOKEN', 'Invalid change password token');
  }
}

export class ExpiredChangePasswordTokenError extends DomainError {
  constructor() {
    super('EXPIRED_CHANGE_PASSWORD_TOKEN', 'Change password token has expired');
  }
}
