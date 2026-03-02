import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '@/core/database/connection';
import { ProfileRepository } from '@/modules/auth/domain/ports/profile.repository.port';
import { Profile } from '@/modules/auth/domain/entities/profile.entity';

@Injectable()
export class DrizzleProfileRepository implements ProfileRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async findByUsername(username: string): Promise<Profile | null> {
    const row = await this.db.query.profile.findFirst({
      where: eq(schema.profile.username, username.toLowerCase()),
    });
    if (!row) return null;
    return new Profile(
      row.id,
      row.userId,
      row.username,
      row.displayName || '',
      row.birthDate || new Date(),
    );
  }

  async save(profile: Profile, tx?: DrizzleDatabase): Promise<void> {
    const db = tx || this.db;
    await db.insert(schema.profile).values({
      id: profile.id,
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      birthDate: profile.birthDate,
    });
  }
}
