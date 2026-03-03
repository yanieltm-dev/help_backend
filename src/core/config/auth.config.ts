import { registerAs } from '@nestjs/config';
import { IsString, IsOptional } from 'class-validator';
import { validateConfig } from './validate-config';

export type AuthConfig = {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
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
  AUTH_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  AUTH_REFRESH_EXPIRES_IN: string;
}

export default registerAs<AuthConfig>('auth', () => {
  validateConfig(process.env, EnvironmentVariables);

  return {
    jwtSecret: process.env.AUTH_JWT_SECRET || 'secret',
    jwtExpiresIn: process.env.AUTH_JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.AUTH_REFRESH_SECRET || 'refresh-secret',
    refreshExpiresIn: process.env.AUTH_REFRESH_EXPIRES_IN || '7d',
  };
});
