import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { MAIL_SERVICE } from '@/shared/mail/mail.interface';
import type { MailService } from '@/shared/mail/mail.interface';

@Injectable()
export class UserRegisteredListener {
  private readonly logger = new Logger(UserRegisteredListener.name);

  constructor(
    @Inject(MAIL_SERVICE)
    private readonly mailService: MailService,
  ) {}

  @OnEvent('user.registered')
  handleUserRegistered(event: UserRegisteredEvent) {
    this.mailService
      .sendVerificationEmail(event.email, event.verificationToken)
      .catch((error: unknown) => {
        this.logger.error(
          { err: error, email: event.email },
          'Failed to send verification email after registration event',
        );
      });
  }
}
