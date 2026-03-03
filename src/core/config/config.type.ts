import { AppConfig } from './app.config';
import { AuthConfig } from './auth.config';
import { DatabaseConfig } from './database.config';

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
};
