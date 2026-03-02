import { Injectable } from '@nestjs/common';
import { MailService as IMailService } from './mail.interface';

@Injectable()
export class MailService implements IMailService {
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    console.log(
      `[MAIL] Sending verification email to ${to} with token: ${token}`,
    );
  }
}
