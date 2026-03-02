import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '@/core/database/connection';

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async findByEmail(email: string) {
    return this.db.query.user.findFirst({
      where: eq(schema.user.email, email.toLowerCase()),
    });
  }

  async create(data: typeof schema.user.$inferInsert, tx?: DrizzleDatabase) {
    const db = tx || this.db;
    return await db.insert(schema.user).values(data);
  }
}
