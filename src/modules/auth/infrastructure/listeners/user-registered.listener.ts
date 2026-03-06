import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisteredDomainEvent } from '../../domain/events/user-registered.domain-event';
import { MAIL_SERVICE, type MailService } from '@/shared/mail/mail.interface';
import { InjectPinoLogger, Logger } from 'pino-nestjs';

@Injectable()
export class UserRegisteredListener {
  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,

    @InjectPinoLogger(UserRegisteredListener.name)
    private readonly logger: Logger,
  ) {}

  @OnEvent(UserRegisteredDomainEvent.EVENT_NAME as string)
  handleUserRegistered(event: UserRegisteredDomainEvent) {
    this.mailService
      .sendVerificationEmail(
        event.email,
        event.verificationToken,
        event.name,
        event.otpExpiresInMs,
      )
      .catch((error: unknown) => {
        this.logger.error(
          { err: error, userId: event.userId },
          'Failed to send verification email',
        );
      });
  }
}
