import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

const KEY_PATTERN = /^[a-zA-Z0-9/_-]+$/;

export class ConfirmUploadDto {
  @ApiProperty({
    description: 'Unique identifier for the file (UUID)',
    example: '019d10f2-0d3d-71f2-8358-ed329040b57f',
  })
  @IsUUID()
  @IsNotEmpty()
  fileId!: string;

  @ApiProperty({
    description: 'Storage key (path) where the file was uploaded',
    example: 'uploads/019d10f2-0d3d-71f2-8358-ed329040b57f-avatar.png',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(KEY_PATTERN, {
    message:
      'Invalid key format: must contain only alphanumeric characters, underscores, hyphens, and forward slashes',
  })
  key!: string;

  @ApiProperty({
    description: 'MIME type of the uploaded file',
    example: 'image/png',
  })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({
    description: 'Original name of the file before upload',
    example: 'avatar.png',
  })
  @IsString()
  @IsNotEmpty()
  originalName!: string;

  @ApiProperty({
    example: 1048576,
    description: 'Actual file size in bytes',
  })
  @IsNumber()
  @Min(1)
  size!: number;
}
