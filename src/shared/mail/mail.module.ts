import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MAIL_SERVICE, MAIL_TRANSPORT } from './mail.interface';
import { ResendMailTransport } from './resend-mail.transport';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_SERVICE,
      useClass: MailService,
    },
    {
      provide: MAIL_TRANSPORT,
      useClass: ResendMailTransport,
    },
  ],
  exports: [MAIL_SERVICE],
})
export class MailModule {}
