import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PasswordResetRequestedDomainEvent } from '../../domain/events/password-reset-requested.domain-event';
import { MAIL_SERVICE, type MailService } from '@/shared/mail/mail.interface';
import { InjectPinoLogger, Logger } from 'pino-nestjs';

@Injectable()
export class PasswordResetRequestedListener {
  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,

    @InjectPinoLogger(PasswordResetRequestedListener.name)
    private readonly logger: Logger,
  ) {}

  @OnEvent(PasswordResetRequestedDomainEvent.EVENT_NAME as string)
  handlePasswordResetRequested(event: PasswordResetRequestedDomainEvent) {
    this.mailService
      .sendPasswordResetEmail(
        event.email,
        event.otp,
        event.name,
        event.otpExpiresInMs,
      )
      .catch((error: unknown) => {
        this.logger.error(
          { err: error, email: event.email },
          'Failed to send password reset email',
        );
      });
  }
}
