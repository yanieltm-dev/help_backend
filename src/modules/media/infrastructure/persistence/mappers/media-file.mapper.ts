import { MediaFile } from '@/modules/media/domain/entities/media-file.entity';

export class MediaFileMapper {
  static toDomain(row: {
    id: string;
    key: string;
    originalName: string;
    mimeType: string;
    size: number;
    ownerId: string;
    publicUrl: string;
    createdAt: Date;
  }): MediaFile {
    return MediaFile.create(
      row.id,
      row.key,
      row.originalName,
      row.mimeType,
      row.size,
      row.ownerId,
      row.publicUrl,
      row.createdAt,
    );
  }
}
