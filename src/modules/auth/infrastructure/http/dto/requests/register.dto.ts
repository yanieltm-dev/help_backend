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
  name: string;

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
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password too weak. It must have at least 8 characters, one number, and one special character.',
  })
  password: string;
}
