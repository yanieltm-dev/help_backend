import { DomainError } from '@/shared/domain/errors/domain.error';

/**
 * Thrown when the requested upload flow (direct or indirect) is not enabled by configuration.
 */
export class InvalidUploadStrategyError extends DomainError {
  constructor(message: string) {
    super('INVALID_UPLOAD_STRATEGY', message);
  }
}
