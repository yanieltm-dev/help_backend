import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VerificationResendedDomainEvent } from '../../domain/events/verification-resended.domain-event';
import { MAIL_SERVICE, type MailService } from '@/shared/mail/mail.interface';
import { InjectPinoLogger, Logger } from 'pino-nestjs';

@Injectable()
export class VerificationResendedListener {
  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,

    @InjectPinoLogger(VerificationResendedListener.name)
    private readonly logger: Logger,
  ) {}

  @OnEvent(VerificationResendedDomainEvent.EVENT_NAME as string)
  handleVerificationResended(event: VerificationResendedDomainEvent) {
    this.mailService
      .sendVerificationEmail(event.email, event.verificationToken)
      .catch((error: unknown) => {
        this.logger.error(
          { err: error, email: event.email },
          'Failed to send verification email on resend',
        );
      });
  }
}
