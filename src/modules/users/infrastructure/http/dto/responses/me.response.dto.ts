import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty({ nullable: true })
  username: string | null;

  @ApiProperty({ nullable: true })
  displayName: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date' })
  birthDate: Date | null;

  @ApiProperty({ nullable: true })
  bio: string | null;
}
