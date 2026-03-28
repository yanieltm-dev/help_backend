import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GeneratePresignedUrlDto {
  @ApiProperty({ example: 'image/png' })
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @ApiProperty({ example: 'avatar.png' })
  @IsString()
  @IsNotEmpty()
  originalName!: string;

  @ApiProperty({ example: 1024, description: 'File size in bytes' })
  @IsNumber()
  @IsNotEmpty()
  size!: number;
}
