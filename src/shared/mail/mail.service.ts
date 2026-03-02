import { Injectable } from '@nestjs/common';
import { MailService as IMailService } from './mail.interface';
import { InjectPinoLogger, Logger } from 'pino-nestjs';

@Injectable()
export class MailService implements IMailService {
  constructor(
    @InjectPinoLogger(MailService.name)
    private readonly logger: Logger,
  ) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    this.logger.log(
      `[MAIL] Sending verification email to ${to} with token: ${token}`,
    );
    await Promise.resolve();
  }
}
