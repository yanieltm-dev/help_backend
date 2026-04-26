import { ApiProperty } from '@nestjs/swagger';

export class FileUrlResponseDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  isPresigned!: boolean;

  @ApiProperty({ required: false })
  expiresAt?: Date;
}
