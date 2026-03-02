import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MAIL_SERVICE } from './mail.interface';

@Global()
@Module({
  providers: [
    {
      provide: MAIL_SERVICE,
      useClass: MailService,
    },
  ],
  exports: [MAIL_SERVICE],
})
export class MailModule {}
