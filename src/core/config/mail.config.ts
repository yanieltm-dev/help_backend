import { registerAs } from '@nestjs/config';
import { IsOptional, IsString } from 'class-validator';
import { validateConfig } from './validate-config';

export type MailConfig = {
  resendApiKey?: string;
  from: string;
  replyTo?: string;
};

class EnvironmentVariables {
  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  MAIL_FROM?: string;

  @IsString()
  @IsOptional()
  MAIL_REPLY_TO?: string;
}

export default registerAs<MailConfig>('mail', () => {
  validateConfig(process.env, EnvironmentVariables);

  return {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.MAIL_FROM || 'Help <no-reply@example.com>',
    replyTo: process.env.MAIL_REPLY_TO,
  };
});
