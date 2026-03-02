import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '@/core/database/connection';

@Injectable()
export class ProfileRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async findByUsername(username: string) {
    return this.db.query.profile.findFirst({
      where: eq(schema.profile.username, username.toLowerCase()),
    });
  }

  async findByUserId(userId: string) {
    return this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
    });
  }

  async create(data: typeof schema.profile.$inferInsert, tx?: DrizzleDatabase) {
    const db = tx || this.db;
    return await db.insert(schema.profile).values(data);
  }
}
