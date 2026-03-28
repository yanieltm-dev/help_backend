import { DomainError } from '@/shared/domain/errors/domain.error';

export class StorageProviderError extends DomainError {
  constructor(
    message: string,
    public readonly provider: string,
  ) {
    super(message);
  }
}
