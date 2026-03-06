import type { Session } from '../entities/session.entity';

export interface SessionRepository {
  save(session: Session, tx?: unknown): Promise<void>;
  findByToken(token: string): Promise<Session | null>;
  deleteByToken(token: string): Promise<void>;
  deleteByUserId(userId: string, tx?: unknown): Promise<void>;
}
