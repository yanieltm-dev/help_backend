import { FileName } from '../value-objects/file-name.vo';
import { FilePath } from '../value-objects/file-path.vo';
import { FileSize } from '../value-objects/file-size.vo';
import { MimeType } from '../value-objects/mime-type.vo';

export class MediaFile {
  private constructor(
    public readonly id: string,
    public readonly key: FilePath,
    public readonly originalName: FileName,
    public readonly mimeType: MimeType,
    public readonly size: FileSize,
    public readonly ownerId: string,
    public readonly publicUrl: string,
    public readonly createdAt: Date,
  ) {}

  static create(
    id: string,
    key: string,
    originalName: string,
    mimeType: string,
    size: number,
    ownerId: string,
    publicUrl: string,
    createdAt: Date = new Date(),
  ): MediaFile {
    return new MediaFile(
      id,
      FilePath.create(key),
      FileName.create(originalName),
      MimeType.create(mimeType),
      FileSize.create(size),
      ownerId,
      publicUrl,
      createdAt,
    );
  }

  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }
}
