import { MediaFile } from '../entities/media-file.entity';

export interface MediaRepository {
  findById(id: string): Promise<MediaFile | null>;
  findByOwnerId(ownerId: string): Promise<MediaFile[]>;
  save(mediaFile: MediaFile, tx?: unknown): Promise<void>;
  delete(id: string, tx?: unknown): Promise<void>;
}
