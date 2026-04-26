import { ApiProperty } from '@nestjs/swagger';
import {
  IsMimeType,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

const MAX_SAFE_FILE_SIZE = 104857600;

export class GeneratePresignedUrlDto {
  @ApiProperty({ example: 'image/png' })
  @IsMimeType()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ example: 'avatar.png' })
  @IsString()
  @IsNotEmpty()
  originalName!: string;

  @ApiProperty({ example: 1024, description: 'File size in bytes' })
  @IsNumber()
  @Min(1)
  @Max(MAX_SAFE_FILE_SIZE)
  size!: number;
}
