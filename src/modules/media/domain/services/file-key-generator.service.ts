/**
 * Service to generate and sanitize file keys for storage.
 */
export class FileKeyGenerator {
  /**
   * Generates a storage key for a file.
   *
   * @param params - Parameters for key generation
   * @returns Sanitized storage key
   */
  execute(params: {
    fileId: string;
    originalName: string;
    mimeType: string;
  }): string {
    const sanitizedName = params.originalName
      .replace(/[^a-zA-Z0-9.-]/g, '-')
      .toLowerCase();

    const [type] = params.mimeType.split('/');
    let folder = 'media/others';

    if (type === 'image') {
      folder = 'media/images';
    } else if (type === 'video') {
      folder = 'media/videos';
    } else if (
      type === 'audio' ||
      type === 'text' ||
      params.mimeType === 'application/pdf'
    ) {
      folder = 'media/documents';
    }

    return `${folder}/${params.fileId}-${sanitizedName}`;
  }
}
