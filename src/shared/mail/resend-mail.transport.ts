import { Injectable, OnModuleInit } from '@nestjs/common';
import { Resend } from 'resend';
import type {
  MailTransport,
  TransactionalEmail,
  TransportSendResult,
} from './mail.interface';
import { ConfigService } from '@nestjs/config';
import type { AllConfigType } from '@/core/config/config.type';
import { InjectPinoLogger, PinoLogger } from 'pino-nestjs';

@Injectable()
export class ResendMailTransport implements MailTransport, OnModuleInit {
  private resend: Resend | null = null;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    @InjectPinoLogger(ResendMailTransport.name)
    private readonly logger: PinoLogger,
  ) {}

  onModuleInit() {
    const mailConfig = this.configService.get('mail', { infer: true });
    if (mailConfig?.resendApiKey) {
      this.resend = new Resend(mailConfig.resendApiKey);
    } else {
      this.logger.warn(
        'RESEND_API_KEY is not configured. ResendMailTransport will not work.',
      );
    }
  }

  async send(email: TransactionalEmail): Promise<TransportSendResult> {
    if (!this.resend) {
      this.logger.error('Resend SDK is not initialized (missing API key)');
      throw new Error('Mail provider not configured');
    }

    const mailConfig = this.configService.getOrThrow('mail', { infer: true });
    const from = email.from ?? mailConfig.from;

    const { data, error } = await this.resend.emails.send({
      from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: email.replyTo ?? mailConfig.replyTo,
      tags: email.tags?.map((name) => ({ name, value: 'true' })),
    });

    if (error) {
      this.logger.error(
        { error, to: email.to, subject: email.subject },
        'Failed to send email via Resend SDK',
      );
      throw new Error(`Failed to send email: ${error.message}`);
    }

    this.logger.info(
      { to: email.to, subject: email.subject, providerMessageId: data?.id },
      'Email sent via Resend SDK',
    );

    return { providerMessageId: data?.id };
  }
}
