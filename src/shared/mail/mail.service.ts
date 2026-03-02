import { Injectable } from '@nestjs/common';
import { MailService as IMailService } from './mail.interface';
import { InjectPinoLogger, PinoLogger } from 'pino-nestjs';

@Injectable()
export class MailService implements IMailService {
  constructor(
    @InjectPinoLogger(MailService.name)
    private readonly logger: PinoLogger,
  ) {}

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    this.logger.info(
      `[MAIL] Sending verification email to ${to} with token: ${token}`,
    );
    await Promise.resolve();
  }
}
