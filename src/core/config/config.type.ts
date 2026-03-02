import { AppConfig } from './app.config';
import { DatabaseConfig } from './database.config';

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
};
