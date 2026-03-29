import type { DrizzleDatabase } from '@/core/database/connection';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import { Profile } from '@/modules/users/domain/entities/profile.entity';
import { ProfileRepository } from '@/modules/users/domain/ports/profile.repository.port';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

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
      row.avatarUrl ?? null,
      row.birthDate || new Date(),
    );
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const row = await this.db.query.profile.findFirst({
      where: eq(schema.profile.userId, userId),
    });
    if (!row) return null;
    return new Profile(
      row.id,
      row.userId,
      row.username,
      row.displayName || '',
      row.avatarUrl ?? null,
      row.birthDate || new Date(),
    );
  }

  async save(profile: Profile, tx?: DrizzleDatabase): Promise<void> {
    const db = tx || this.db;
    await db
      .insert(schema.profile)
      .values({
        id: profile.id,
        userId: profile.userId,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        birthDate: profile.birthDate,
      })
      .onConflictDoUpdate({
        target: schema.profile.id,
        set: {
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          birthDate: profile.birthDate,
          updatedAt: new Date(),
        },
      });
  }
}
