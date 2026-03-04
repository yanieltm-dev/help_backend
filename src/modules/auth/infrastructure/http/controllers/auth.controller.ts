import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Version,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/core/config/config.type';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { VerifyEmailUseCase } from '../../../application/use-cases/verify-email.use-case';
import { ResendVerificationUseCase } from '../../../application/use-cases/resend-verification.use-case';
import { LoginUseCase } from '../../../application/use-cases/login.use-case';
import { RegisterDto } from '../dto/register.dto';
import { VerifyEmailDto, ResendVerificationDto } from '../dto/verification.dto';
import { LoginDto } from '../dto/login.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterResponseDto } from '../responses/register.response';
import { LoginResponseDto } from '../responses/login.response';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  @Post('register')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: RegisterResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid data',
  })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  async register(@Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    const result = await this.registerUserUseCase.execute(dto);
    return {
      message: 'Verification email sent',
      userId: result.userId,
    };
  }

  @Post('verify-email')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email with OTP' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid, expired, or max attempts exceeded for OTP',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.verifyEmailUseCase.execute(dto);
    return { message: 'Email verified successfully' };
  }

  @Post('resend-verification')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email resent' })
  @ApiResponse({
    status: 400,
    description: 'User not found or email already verified',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.resendVerificationUseCase.execute(dto);
    return { message: 'Verification email resent' };
  }

  @Post('login')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({
    status: 403,
    description: 'Account locked or email not verified',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { accessToken, refreshToken, accessTokenExpiresAt } =
      await this.loginUseCase.execute({
        ...dto,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true, // Should be true in production, assuming HTTPS
      sameSite: 'strict',
      maxAge: this.configService.getOrThrow('auth.sessionExpiresInMs', {
        infer: true,
      }),
    });

    return {
      accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
    };
  }
}
