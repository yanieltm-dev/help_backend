import { VerificationToken } from '../entities/verification-token.entity';

export interface VerificationRepository {
  save(token: VerificationToken, tx?: unknown): Promise<void>;

  countRecentForIdentifierAndTypeSince(
    identifier: string,
    type: string,
    since: Date,
  ): Promise<number>;

  findByIdentifierAndType(
    identifier: string,
    type: string,
  ): Promise<VerificationToken | null>;

  findByIdAndType(id: string, type: string): Promise<VerificationToken | null>;

  delete(id: string): Promise<void>;

  invalidateAllForIdentifier(identifier: string, type: string): Promise<void>;
}
