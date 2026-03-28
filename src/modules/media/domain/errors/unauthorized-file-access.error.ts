import { DomainError } from '@/shared/domain/errors/domain.error';

export class UnauthorizedFileAccessError extends DomainError {
  constructor(
    public readonly userId: string,
    public readonly fileId: string,
  ) {
    super(`User "${userId}" is not authorized to access file "${fileId}"`);
  }
}
