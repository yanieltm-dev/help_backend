import { ApiProperty } from '@nestjs/swagger';

export class MediaFileResponseDto {
  @ApiProperty({ example: '019d10f2-0d3d-71f2-8358-ed329040b57f' })
  id!: string;

  @ApiProperty({ example: 'uploads/file-name.jpg' })
  key!: string;

  @ApiProperty({ example: 'https://storage.example.com/uploads/file-name.jpg' })
  publicUrl!: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType!: string;

  @ApiProperty({ example: 1024, description: 'File size in bytes' })
  size!: number;

  @ApiProperty({ example: '019d10f2-0d3d-71f2-8358-ed329040b57f' })
  ownerId!: string;
}
