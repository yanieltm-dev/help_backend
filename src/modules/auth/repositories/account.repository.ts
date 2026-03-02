import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import { eq, and } from 'drizzle-orm';
import type { DrizzleDatabase } from '@/core/database/connection';

@Injectable()
export class AccountRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async findByProvider(providerId: string, accountId: string) {
    return await this.db.query.account.findFirst({
      where: and(
        eq(schema.account.providerId, providerId),
        eq(schema.account.accountId, accountId),
      ),
    });
  }

  async create(data: typeof schema.account.$inferInsert, tx?: DrizzleDatabase) {
    const db = tx || this.db;
    return await db.insert(schema.account).values(data);
  }
}
