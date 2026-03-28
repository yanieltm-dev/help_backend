import { ApiProperty } from '@nestjs/swagger';

export class DeleteMediaResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the deletion was successful',
  })
  success: boolean;
}
