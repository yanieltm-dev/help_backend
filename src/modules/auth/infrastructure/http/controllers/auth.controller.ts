import { AllConfigType } from '@/core/config/config.type';
import { ChangePasswordWithTokenUseCase } from '@/modules/auth/application/use-cases/change-password-with-token.use-case';
import { ChangePasswordUseCase } from '@/modules/auth/application/use-cases/change-password.use-case';
import { GetMeUseCase } from '@/modules/auth/application/use-cases/get-me.use-case';
import { LoginUseCase } from '@/modules/auth/application/use-cases/login.use-case';
import { LogoutUseCase } from '@/modules/auth/application/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { RegisterUserUseCase } from '@/modules/auth/application/use-cases/register-user.use-case';
import { RequestPasswordResetUseCase } from '@/modules/auth/application/use-cases/request-password-reset.use-case';
import { ResendVerificationUseCase } from '@/modules/auth/application/use-cases/resend-verification.use-case';
import { VerifyEmailUseCase } from '@/modules/auth/application/use-cases/verify-email.use-case';
import { VerifyPasswordResetOtpUseCase } from '@/modules/auth/application/use-cases/verify-password-reset-otp.use-case';
import { InvalidRefreshTokenError } from '@/modules/auth/domain/errors/invalid-refresh-token.error';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../../security/jwt.strategy';
import { CurrentAuth } from '../decorators/current-auth.decorator';
import { ChangePasswordDto } from '../dto/requests/change-password.dto';
import { LoginDto } from '../dto/requests/login.dto';
import {
  ChangePasswordWithTokenDto,
  RequestPasswordResetDto,
  VerifyPasswordResetOtpDto,
} from '../dto/requests/password-reset.dto';
import { RegisterDto } from '../dto/requests/register.dto';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from '../dto/requests/verification.dto';
import { LoginResponseDto } from '../dto/responses/login.response.dto';
import { MeResponseDto } from '../dto/responses/me.response.dto';
import { RegisterResponseDto } from '../dto/responses/register.response.dto';

function getCookie(req: Request, name: string): string | undefined {
  const cookiesUnknown: unknown = (req as Request & { cookies?: unknown })
    .cookies;
  if (!cookiesUnknown || typeof cookiesUnknown !== 'object') return undefined;
  const value = (cookiesUnknown as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : undefined;
}

function getUserAgent(req: Request): string | undefined {
  const header = req.headers['user-agent'];
  if (typeof header === 'string') return header;
  return undefined;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly verifyPasswordResetOtpUseCase: VerifyPasswordResetOtpUseCase,
    private readonly changePasswordWithTokenUseCase: ChangePasswordWithTokenUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
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
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Invalid, expired, or max attempts exceeded for OTP',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const { accessToken, refreshToken, accessTokenExpiresAt, user } =
      await this.verifyEmailUseCase.execute({
        ...dto,
        ipAddress: req.ip,
        userAgent: getUserAgent(req),
      });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: this.configService.getOrThrow('auth.sessionExpiresInMs', {
        infer: true,
      }),
    });

    return {
      accessToken,
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      user,
    };
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

  @Post('request-password-reset')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiResponse({
    status: 200,
    description:
      'If the email exists, a password reset code is sent. The response is always generic.',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    await this.requestPasswordResetUseCase.execute(dto);
    return {
      message:
        'If an account with this email exists, a password reset code has been sent.',
    };
  }

  @Post('verify-password-reset-otp')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset OTP and get change token' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified, returns changePasswordToken',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid, expired, or max attempts exceeded for OTP',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async verifyPasswordResetOtp(@Body() dto: VerifyPasswordResetOtpDto) {
    return this.verifyPasswordResetOtpUseCase.execute(dto);
  }

  @Post('change-password-with-token')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password with changePasswordToken' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired change password token',
  })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async changePasswordWithToken(@Body() dto: ChangePasswordWithTokenDto) {
    await this.changePasswordWithTokenUseCase.execute(dto);
    return { message: 'Password changed successfully' };
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
    const { accessToken, refreshToken, accessTokenExpiresAt, user } =
      await this.loginUseCase.execute({
        ...dto,
        ipAddress: req.ip,
        userAgent: getUserAgent(req),
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
      user,
    };
  }

  @Post('refresh')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const refreshToken = getCookie(req, 'refresh_token');

    if (!refreshToken) {
      throw new InvalidRefreshTokenError();
    }

    const {
      accessToken,
      accessTokenExpiresAt,
      refreshToken: newRefreshToken,
    } = await this.refreshSessionUseCase.execute({
      refreshToken,
      ipAddress: req.ip,
      userAgent: getUserAgent(req),
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: true,
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

  @Post('logout')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const refreshToken = getCookie(req, 'refresh_token');

    await this.logoutUseCase.execute({
      refreshToken: refreshToken ?? '',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return { message: 'Logged out' };
  }

  @Get('me')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(
    @CurrentAuth() auth: AuthenticatedRequestUser,
  ): Promise<MeResponseDto> {
    return this.getMeUseCase.execute({ userId: auth.userId });
  }

  @Patch('change-password')
  @Version('1')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  async changePassword(
    @CurrentAuth() auth: AuthenticatedRequestUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const refreshToken = getCookie(req, 'refresh_token') ?? '';
    await this.changePasswordUseCase.execute({
      userId: auth.userId,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
      currentRefreshToken: refreshToken,
    });
    return { message: 'Password changed successfully' };
  }
}
