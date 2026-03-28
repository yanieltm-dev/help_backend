export interface UploadParams {
  key: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  publicUrl: string;
}

export interface PresignedUrlParams {
  key: string;
  operation: 'read' | 'write';
  expiresInSeconds: number;
}

export interface StorageProvider {
  upload(params: UploadParams): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
  getPresignedUrl(params: PresignedUrlParams): Promise<string>;
  supportsPresignedUrls(): boolean;
}
