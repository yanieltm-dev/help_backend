import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  userId: string;
}
