import { ApiProperty } from '@nestjs/swagger';

class LoginUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  image: string | null;

  @ApiProperty()
  emailVerified: boolean;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  accessTokenExpiresAt: string;

  @ApiProperty({ required: false, type: LoginUserResponseDto })
  user?: LoginUserResponseDto;
}
