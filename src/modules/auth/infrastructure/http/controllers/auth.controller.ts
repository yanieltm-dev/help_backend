import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Version,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { RegisterDto } from '../dto/register.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterResponseDto } from '../responses/register.response';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post('register')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: RegisterResponseDto })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    const result = await this.registerUserUseCase.execute(dto);
    return {
      message: 'Verification email sent',
      userId: result.userId,
    };
  }
}
