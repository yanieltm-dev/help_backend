import { AppConfig } from './app.config';
import { AuthConfig } from './auth.config';
import { DatabaseConfig } from './database.config';
import { MailConfig } from './mail.config';
import { MediaConfig } from './media.config';

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
  auth: AuthConfig;
  mail: MailConfig;
  media: MediaConfig;
};
