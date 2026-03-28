import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import { validateConfig } from './validate-config';

export const PROVIDER = {
  LOCAL: 'local',
  S3: 's3',
  S3_PRESIGNED: 's3-presigned',
} as const;

export type Provider = (typeof PROVIDER)[keyof typeof PROVIDER];

export type MediaConfig = {
  provider: Provider;
  bucket: string | undefined;
  region: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
  endpoint: string | undefined;
  publicBaseUrl: string | undefined;
  localPath: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  presignedUrlExpiry: number;
};

class EnvironmentVariables {
  @IsString()
  @IsOptional()
  STORAGE_PROVIDER?: string;

  @IsString()
  @IsOptional()
  STORAGE_BUCKET?: string;

  @IsString()
  @IsOptional()
  STORAGE_REGION?: string;

  @IsString()
  @IsOptional()
  STORAGE_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  STORAGE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STORAGE_ENDPOINT?: string;

  @IsString()
  @IsOptional()
  STORAGE_PUBLIC_URL?: string;

  @IsString()
  @IsOptional()
  STORAGE_LOCAL_PATH?: string;

  @IsString()
  @IsOptional()
  MAX_FILE_SIZE?: string;

  @IsString()
  @IsOptional()
  ALLOWED_MIME_TYPES?: string;

  @IsString()
  @IsOptional()
  PRESIGNED_URL_EXPIRY?: string;
}

export default registerAs<MediaConfig>('media', () => {
  validateConfig(process.env, EnvironmentVariables);

  return {
    provider: (process.env.STORAGE_PROVIDER as Provider) || PROVIDER.LOCAL,
    bucket: process.env.STORAGE_BUCKET,
    region: process.env.STORAGE_REGION,
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
    endpoint: process.env.STORAGE_ENDPOINT,
    publicBaseUrl: process.env.STORAGE_PUBLIC_URL,
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES || 'image/*,video/*,application/pdf'
    ).split(','),
    presignedUrlExpiry: parseInt(
      process.env.PRESIGNED_URL_EXPIRY || '3600',
      10,
    ),
  };
});
