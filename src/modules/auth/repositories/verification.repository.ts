import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import type { DrizzleDatabase } from '@/core/database/connection';

@Injectable()
export class VerificationRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async create(
    data: typeof schema.verification.$inferInsert,
    tx?: DrizzleDatabase,
  ) {
    const db = tx || this.db;
    return await db.insert(schema.verification).values(data);
  }
}
