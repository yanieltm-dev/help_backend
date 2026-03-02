import { VerificationToken } from '../entities/verification-token.entity';

export interface VerificationRepository {
  save(token: VerificationToken, tx?: any): Promise<void>;
}
