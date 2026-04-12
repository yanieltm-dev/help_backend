import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import { validateConfig } from './validate-config';

export type DatabaseConfig = {
  url: string;
};

class EnvironmentVariablesValidator {
  @IsString()
  DATABASE_HOST: string;

  @IsString()
  DATABASE_PORT: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  DATABASE_USER: string;

  @IsString()
  DATABASE_PASSWORD: string;
}

export default registerAs<DatabaseConfig>('database', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const host = process.env.DATABASE_HOST;
  const port = process.env.DATABASE_PORT;
  const name = process.env.DATABASE_NAME;

  return {
    url: `postgresql://${user}:${password}@${host}:${port}/${name}`,
  };
});
