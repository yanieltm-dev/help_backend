import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import { validateConfig } from './validate-config';

export type DatabaseConfig = {
  url: string;
};

class EnvironmentVariablesValidator {
  @IsString()
  DATABASE_URL: string;
}

export default registerAs<DatabaseConfig>('database', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    url: process.env.DATABASE_URL as string,
  };
});
