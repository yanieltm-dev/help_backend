import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '@/core/database/connection';
import { UserRepository } from '@/modules/auth/domain/ports/user.repository.port';
import { User } from '@/modules/auth/domain/entities/user.entity';

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.query.user.findFirst({
      where: eq(schema.user.email, email.toLowerCase()),
    });
    if (!row) return null;
    return User.create(row.id, row.email, row.name);
  }

  async save(user: User, tx?: DrizzleDatabase): Promise<void> {
    const db = tx || this.db;
    await db.insert(schema.user).values({
      id: user.id,
      email: user.email.value,
      name: user.name,
      createdAt: user.createdAt,
    });
  }
}
