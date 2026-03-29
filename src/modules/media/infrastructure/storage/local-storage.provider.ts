import type { AllConfigType } from '@/core/config/config.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import type {
  StorageProvider,
  UploadParams,
  UploadResult,
} from '../../domain/ports/storage-provider.port';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly localPath: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.localPath =
      this.configService.get('media.localPath', { infer: true }) || './uploads';
    this.publicBaseUrl =
      this.configService.get('media.publicBaseUrl', { infer: true }) ||
      'http://localhost:3000/uploads';
  }

  getPresignedUrl(): Promise<string> {
    return Promise.reject(
      new Error('Local storage does not support presigned URLs'),
    );
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const fullPath = join(this.localPath, params.key);
    await fs.mkdir(dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, params.buffer);

    return {
      key: params.key,
      publicUrl: `${this.publicBaseUrl}/${params.key}`,
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.localPath, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File doesn't exist, ignore
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = join(this.localPath, key);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }

  supportsPresignedUrls(): boolean {
    return false;
  }
}
