import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MinAgeRegistration } from '../../../../../auth/infrastructure/http/validators/min-age-registration.validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'johndoe' })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^(?!.*\.\.)(?!\.)(?!.*\.$)[a-zA-Z0-9._]+$/, {
    message:
      'Username can only contain letters, numbers, underscores and dots. It cannot start or end with a dot, or have consecutive dots.',
  })
  userName?: string;

  @ApiPropertyOptional({ example: 'John de Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsISO8601()
  @MinAgeRegistration()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(255)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Hello, I am a supportive person!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
