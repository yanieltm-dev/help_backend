import type { DrizzleDatabase } from '@/core/database/connection';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { MediaFile } from '../../../domain/entities/media-file.entity';
import type { MediaRepository } from '../../../domain/ports/media-repository.port';
import { MediaFileMapper } from '../mappers/media-file.mapper';

@Injectable()
export class DrizzleMediaRepository implements MediaRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async findById(id: string): Promise<MediaFile | null> {
    const row = await this.db.query.mediaFile.findFirst({
      where: eq(schema.mediaFile.id, id),
    });
    if (!row) return null;
    return MediaFileMapper.toDomain(row);
  }

  async findByOwnerId(ownerId: string): Promise<MediaFile[]> {
    const rows = await this.db.query.mediaFile.findMany({
      where: eq(schema.mediaFile.ownerId, ownerId),
    });
    return rows.map((row) => MediaFileMapper.toDomain(row));
  }

  async save(mediaFile: MediaFile, tx?: DrizzleDatabase): Promise<void> {
    const db = tx || this.db;
    await db
      .insert(schema.mediaFile)
      .values({
        id: mediaFile.id,
        key: mediaFile.key.value,
        originalName: mediaFile.originalName.value,
        mimeType: mediaFile.mimeType.value,
        size: mediaFile.size.value,
        ownerId: mediaFile.ownerId,
        publicUrl: mediaFile.publicUrl,
        createdAt: mediaFile.createdAt,
      })
      .onConflictDoUpdate({
        target: schema.mediaFile.id,
        set: {
          key: mediaFile.key.value,
          originalName: mediaFile.originalName.value,
          mimeType: mediaFile.mimeType.value,
          size: mediaFile.size.value,
          publicUrl: mediaFile.publicUrl,
        },
      });
  }

  async delete(id: string, tx?: DrizzleDatabase): Promise<void> {
    const db = tx || this.db;
    await db.delete(schema.mediaFile).where(eq(schema.mediaFile.id, id));
  }
}
