import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super('Invalid or expired refresh token');
  }
}
