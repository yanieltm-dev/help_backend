import type { AllConfigType } from '@/core/config/config.type';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  PresignedUrlParams,
  StorageProvider,
  UploadParams,
  UploadResult,
} from '../../domain/ports/storage-provider.port';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const region = this.configService.get('media.region', { infer: true });
    const accessKeyId = this.configService.get('media.accessKeyId', {
      infer: true,
    });
    const secretAccessKey = this.configService.get('media.secretAccessKey', {
      infer: true,
    });
    const endpoint = this.configService.get('media.endpoint', { infer: true });

    this.bucket = this.configService.get('media.bucket', { infer: true })!;

    this.client = new S3Client({
      region: region || 'us-east-1',
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint,
    });
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      Body: params.buffer,
      ContentType: params.mimeType,
      Metadata: params.metadata,
    });

    await this.client.send(command);

    return {
      key: params.key,
      publicUrl: this.getPublicUrl(params.key),
    };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    const publicBaseUrl = this.configService.get('media.publicBaseUrl', {
      infer: true,
    });
    if (publicBaseUrl) {
      return `${publicBaseUrl}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async getPresignedUrl(params: PresignedUrlParams): Promise<string> {
    const command =
      params.operation === 'read'
        ? new GetObjectCommand({ Bucket: this.bucket, Key: params.key })
        : new PutObjectCommand({ Bucket: this.bucket, Key: params.key });

    return getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds,
    });
  }

  supportsPresignedUrls(): boolean {
    return true;
  }
}
