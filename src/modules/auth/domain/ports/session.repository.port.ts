import type { DrizzleDatabase } from '@/core/database/connection';
import type { Session } from '../entities/session.entity';

export interface SessionRepository {
  save(session: Session, db?: DrizzleDatabase): Promise<void>;
  findByToken(token: string): Promise<Session | null>;
  deleteByToken(token: string): Promise<void>;
}
