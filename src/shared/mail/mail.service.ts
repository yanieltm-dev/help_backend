import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AllConfigType } from '@/core/config/config.type';
import type {
  MailService as IMailService,
  MailTransport,
  TransactionalEmail,
  TransportSendResult,
} from './mail.interface';
import { InjectPinoLogger, PinoLogger } from 'pino-nestjs';
import { MAIL_TRANSPORT } from './mail.interface';
import { buildVerificationOtpHtml } from './templates/v1/verification-otp';
import { buildPasswordResetOtpHtml } from './templates/v1/password-reset-otp';

const LOGO_PATH = '/assets/logo.png';

@Injectable()
export class MailService implements IMailService {
  constructor(
    @InjectPinoLogger(MailService.name)
    private readonly logger: PinoLogger,
    @Inject(MAIL_TRANSPORT)
    private readonly transport: MailTransport,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  private getTemplateContext(): { appName: string; logoUrl?: string } {
    const app = this.configService.getOrThrow('app', { infer: true });
    return {
      appName: app.name,
      logoUrl: `${app.backendDomain.replace(/\/$/, '')}${LOGO_PATH}`,
    };
  }

  async sendVerificationEmail(
    to: string,
    otp: string,
    name: string,
    otpExpiresInMs: number,
  ): Promise<void> {
    const environment = this.configService.getOrThrow('app.nodeEnv', {
      infer: true,
    });
    // log otp code if environment is development
    if (environment === 'development') {
      this.logger.info(
        { to, otp },
        `[MAIL] Sending verification email with otp code: ${otp} to ${to}`,
      );
    } else {
      this.logger.info({ to }, '[MAIL] Sending verification email');
    }

    const { appName, logoUrl } = this.getTemplateContext();
    const html = buildVerificationOtpHtml({
      name,
      otp,
      expiresInMs: otpExpiresInMs,
      appName,
      logoUrl,
    });

    await this.sendTransactionalEmail({
      to,
      subject: 'Verify your email',
      html,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    otp: string,
    name: string,
    otpExpiresInMs: number,
  ): Promise<void> {
    const environment = this.configService.getOrThrow('app.nodeEnv', {
      infer: true,
    });
    // log otp code if environment is development
    if (environment === 'development') {
      this.logger.info(
        { to, otp },
        `[MAIL] Sending password reset email with otp code: ${otp} to ${to}`,
      );
    } else {
      this.logger.info({ to }, '[MAIL] Sending password reset email');
    }

    const { appName, logoUrl } = this.getTemplateContext();
    const html = buildPasswordResetOtpHtml({
      name,
      otp,
      expiresInMs: otpExpiresInMs,
      appName,
      logoUrl,
    });

    await this.sendTransactionalEmail({
      to,
      subject: 'Reset your password',
      html,
    });
  }

  async sendTransactionalEmail(
    email: TransactionalEmail,
  ): Promise<TransportSendResult> {
    const result = await this.transport.send(email);
    this.logger.info(
      {
        to: email.to,
        subject: email.subject,
        providerMessageId: result.providerMessageId,
      },
      '[MAIL] Transactional email sent',
    );
    return result;
  }
}
