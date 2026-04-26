import { ApiProperty } from '@nestjs/swagger';

class LoginUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  avatarUrl: string | null;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  username: string;

  @ApiProperty()
  displayName: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  accessTokenExpiresAt: string;

  @ApiProperty({ required: false, type: LoginUserResponseDto })
  user?: LoginUserResponseDto;
}
