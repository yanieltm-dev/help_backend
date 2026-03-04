import { VerificationToken } from '../entities/verification-token.entity';

export interface VerificationRepository {
  save(token: VerificationToken, tx?: unknown): Promise<void>;

  findByIdentifierAndType(
    identifier: string,
    type: string,
  ): Promise<VerificationToken | null>;

  delete(id: string): Promise<void>;

  invalidateAllForIdentifier(identifier: string, type: string): Promise<void>;
}
