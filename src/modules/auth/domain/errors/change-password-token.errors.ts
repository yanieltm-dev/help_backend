import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidChangePasswordTokenError extends DomainError {
  constructor() {
    super('Invalid change password token');
  }
}

export class ExpiredChangePasswordTokenError extends DomainError {
  constructor() {
    super('Change password token has expired');
  }
}
