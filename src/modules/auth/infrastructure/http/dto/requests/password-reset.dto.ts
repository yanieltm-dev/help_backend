import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_VALIDATION_REGEX,
  PASSWORD_VALIDATION_MESSAGE,
} from '@/modules/auth/domain/value-objects/password.validation';

export class RequestPasswordResetDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class VerifyPasswordResetOtpDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}

export class ChangePasswordWithTokenDto {
  @ApiProperty({ example: 'change-token-id.change-token-secret' })
  @IsString()
  @IsNotEmpty()
  changePasswordToken: string;

  @ApiProperty({ example: 'NewPassword123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(PASSWORD_VALIDATION_REGEX, {
    message: PASSWORD_VALIDATION_MESSAGE,
  })
  newPassword: string;
}
