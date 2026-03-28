import {
  PASSWORD_VALIDATION_MESSAGE,
  PASSWORD_VALIDATION_REGEX,
} from '@/modules/auth/domain/value-objects/password.validation';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MinAgeRegistration } from '../../validators/min-age-registration.validator';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  displayName: string;

  @ApiProperty({ example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]+$/, {
    message:
      'Username can only contain letters, numbers, underscores and dots. It cannot start or end with a dot, or have consecutive dots.',
  })
  username: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsISO8601()
  @MinAgeRegistration()
  @IsNotEmpty()
  birthDate: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'P@ssword123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(PASSWORD_VALIDATION_REGEX, {
    message: PASSWORD_VALIDATION_MESSAGE,
  })
  password: string;
}
