import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
  }
}
