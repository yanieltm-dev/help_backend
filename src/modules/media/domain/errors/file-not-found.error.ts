import { DomainError } from '@/shared/domain/errors/domain.error';

export class FileNotFoundError extends DomainError {
  constructor(fileId: string) {
    super(`File with ID "${fileId}" not found`);
  }
}
