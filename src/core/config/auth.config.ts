import { registerAs } from '@nestjs/config';
import { IsString, IsOptional } from 'class-validator';
import { validateConfig } from './validate-config';
import { parseDuration } from '../../shared/utils/parse-duration';

export type AuthConfig = {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
  cookieSecret: string;
  maxFailedAttempts: number;
  lockoutDurationMs: number;
  otpExpiresInMs: number;
  otpMaxAttempts: number;
  changePasswordTokenExpiresInMs: number;
  sessionExpiresInMs: number;
  resendVerificationMaxRequests: number;
  resendVerificationWindowMs: number;
  minAgeRegister: number;
};

class EnvironmentVariables {
  @IsString()
  @IsOptional()
  AUTH_JWT_SECRET: string;

  @IsString()
  @IsOptional()
  AUTH_JWT_EXPIRES_IN: string;

  @IsString()
  @IsOptional()
  AUTH_REFRESH_EXPIRES_IN: string;

  @IsString()
  @IsOptional()
  AUTH_COOKIE_SECRET: string;

  @IsString()
  @IsOptional()
  AUTH_MAX_FAILED_ATTEMPTS?: string;

  @IsString()
  @IsOptional()
  AUTH_LOCKOUT_DURATION?: string;

  @IsString()
  @IsOptional()
  AUTH_OTP_EXPIRES_IN?: string;

  @IsString()
  @IsOptional()
  AUTH_OTP_MAX_ATTEMPTS?: string;

  @IsString()
  @IsOptional()
  AUTH_CHANGE_PASSWORD_TOKEN_EXPIRES_IN?: string;

  @IsString()
  @IsOptional()
  AUTH_SESSION_EXPIRES_IN?: string;

  @IsString()
  @IsOptional()
  AUTH_RESEND_VERIFICATION_MAX_REQUESTS?: string;

  @IsString()
  @IsOptional()
  AUTH_RESEND_VERIFICATION_WINDOW?: string;

  @IsString()
  @IsOptional()
  AUTH_MIN_AGE_REGISTER?: string;
}

export default registerAs<AuthConfig>('auth', () => {
  validateConfig(process.env, EnvironmentVariables);

  return {
    jwtSecret: process.env.AUTH_JWT_SECRET || 'secret',
    jwtExpiresIn: process.env.AUTH_JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.AUTH_REFRESH_SECRET || 'refresh-secret',
    refreshExpiresIn: process.env.AUTH_REFRESH_EXPIRES_IN || '7d',
    maxFailedAttempts: parseInt(
      process.env.AUTH_MAX_FAILED_ATTEMPTS || '5',
      10,
    ),
    lockoutDurationMs: parseDuration(
      process.env.AUTH_LOCKOUT_DURATION || '15m',
    ),
    otpExpiresInMs: parseDuration(process.env.AUTH_OTP_EXPIRES_IN || '10m'),
    otpMaxAttempts: parseInt(process.env.AUTH_OTP_MAX_ATTEMPTS || '5', 10),
    changePasswordTokenExpiresInMs: parseDuration(
      process.env.AUTH_CHANGE_PASSWORD_TOKEN_EXPIRES_IN || '15m',
    ),
    sessionExpiresInMs: parseDuration(
      process.env.AUTH_SESSION_EXPIRES_IN || '1h',
    ),
    resendVerificationMaxRequests: parseInt(
      process.env.AUTH_RESEND_VERIFICATION_MAX_REQUESTS || '3',
      10,
    ),
    resendVerificationWindowMs: parseDuration(
      process.env.AUTH_RESEND_VERIFICATION_WINDOW || '1h',
    ),
    cookieSecret: process.env.AUTH_COOKIE_SECRET || 'cookie-secret',
    minAgeRegister: parseInt(process.env.AUTH_MIN_AGE_REGISTER || '13', 10),
  };
});
