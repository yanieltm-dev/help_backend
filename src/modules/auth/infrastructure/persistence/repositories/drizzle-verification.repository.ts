import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import type { DrizzleDatabase } from '@/core/database/connection';
import { VerificationRepository } from '@/modules/auth/domain/ports/verification.repository.port';
import { VerificationToken } from '@/modules/auth/domain/entities/verification-token.entity';

@Injectable()
export class DrizzleVerificationRepository implements VerificationRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async save(token: VerificationToken, tx?: DrizzleDatabase): Promise<void> {
    const db = tx || this.db;
    await db.insert(schema.verification).values({
      id: token.id,
      identifier: token.identifier,
      value: token.token,
      type: token.type,
      expiresAt: token.expiresAt,
    });
  }
}
