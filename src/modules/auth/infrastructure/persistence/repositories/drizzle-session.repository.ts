import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import { and, eq, ne } from 'drizzle-orm';
import type { DrizzleDatabase } from '@/core/database/connection';
import { Session } from '@/modules/auth/domain/entities/session.entity';
import { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';

@Injectable()
export class DrizzleSessionRepository implements SessionRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async save(session: Session, tx?: unknown): Promise<void> {
    const db = (tx as DrizzleDatabase | undefined) || this.db;
    await db
      .insert(schema.session)
      .values({
        id: session.id,
        userId: session.userId,
        token: session.token,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.session.id,
        set: {
          token: session.token,
          expiresAt: session.expiresAt,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          updatedAt: new Date(),
        },
      });
  }

  async findByToken(token: string): Promise<Session | null> {
    const row = await this.db.query.session.findFirst({
      where: eq(schema.session.token, token),
    });
    if (!row) return null;
    return new Session(
      row.id,
      row.userId,
      row.token,
      row.expiresAt,
      row.ipAddress || undefined,
      row.userAgent || undefined,
      row.createdAt,
    );
  }

  async deleteByToken(token: string): Promise<void> {
    await this.db.delete(schema.session).where(eq(schema.session.token, token));
  }

  async deleteByUserId(userId: string, tx?: unknown): Promise<void> {
    const db = (tx as DrizzleDatabase | undefined) || this.db;
    await db.delete(schema.session).where(eq(schema.session.userId, userId));
  }

  async deleteByUserIdExceptToken(
    userId: string,
    exceptToken: string,
    tx?: unknown,
  ): Promise<void> {
    const db = (tx as DrizzleDatabase | undefined) || this.db;
    await db
      .delete(schema.session)
      .where(
        and(
          eq(schema.session.userId, userId),
          ne(schema.session.token, exceptToken),
        ),
      );
  }
}
