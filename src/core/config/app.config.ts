import { registerAs } from '@nestjs/config';
import { IsEnum, IsOptional, IsString, Max } from 'class-validator';
import { validateConfig } from './validate-config';

export type AppConfig = {
  nodeEnv: string;
  name: string;
  port: number;
  apiPrefix: string;
  backendDomain: string;
};

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsString()
  @IsOptional()
  name: string;

  @Max(65535)
  @IsOptional()
  PORT: number;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsString()
  @IsOptional()
  BACKEND_DOMAIN?: string;
}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariables);

  return {
    nodeEnv: process.env.NODE_ENV || Environment.Development,
    name: process.env.APP_NAME || 'app',
    port: process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 3000,
    apiPrefix: process.env.API_PREFIX || 'api',
    backendDomain: process.env.APP_URL || 'http://localhost:3000',
  };
});
