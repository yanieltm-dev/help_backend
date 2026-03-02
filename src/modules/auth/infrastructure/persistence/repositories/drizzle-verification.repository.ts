import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import type { DrizzleDatabase } from '@/core/database/connection';
import { VerificationRepository } from '@/modules/auth/domain/ports/verification.repository.port';
import { VerificationToken } from '@/modules/auth/domain/entities/verification-token.entity';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class DrizzleVerificationRepository implements VerificationRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async findByIdentifierAndType(
    identifier: string,
    type: string,
  ): Promise<VerificationToken | null> {
    const row = await this.db.query.verification.findFirst({
      where: and(
        eq(schema.verification.identifier, identifier),
        eq(schema.verification.type, type),
      ),
    });

    if (!row) return null;

    return VerificationToken.create(
      row.id,
      row.identifier,
      row.value,
      row.type as 'email_verification' | 'password_reset',
      0, // not used for reconstruction
      row.attempts,
    ).withFixedExpiration(row.expiresAt, row.createdAt);
  }

  async save(token: VerificationToken, tx?: DrizzleDatabase): Promise<void> {
    const db = tx || this.db;
    await db
      .insert(schema.verification)
      .values({
        id: token.id,
        identifier: token.identifier,
        value: token.token,
        type: token.type,
        expiresAt: token.expiresAt,
        attempts: token.attempts,
        createdAt: token.createdAt,
      })
      .onConflictDoUpdate({
        target: schema.verification.id,
        set: {
          value: token.token,
          expiresAt: token.expiresAt,
          attempts: token.attempts,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(schema.verification)
      .where(eq(schema.verification.id, id));
  }

  async invalidateAllForIdentifier(
    identifier: string,
    type: string,
  ): Promise<void> {
    await this.db
      .delete(schema.verification)
      .where(
        and(
          eq(schema.verification.identifier, identifier),
          eq(schema.verification.type, type),
        ),
      );
  }
}
