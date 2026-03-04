import { DomainErrorMapperRegistry } from './domain-error-registry';
import { DomainError } from '@/shared/domain/errors/domain.error';

export function mapDomainError(error: DomainError) {
  return DomainErrorMapperRegistry.getMapping(error);
}
