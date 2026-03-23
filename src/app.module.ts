import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'pino-nestjs';
import appConfig from './core/config/app.config';
import authConfig from './core/config/auth.config';
import databaseConfig from './core/config/database.config';
import mailConfig from './core/config/mail.config';
import mediaConfig from './core/config/media.config';
import { DatabaseModule } from './core/database/database.module';
import { AppExceptionFilter } from './core/filters/app-exception.filter';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MediaModule } from './modules/media/media.module';
import { MailModule } from './shared/mail/mail.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, databaseConfig, authConfig, mailConfig, mediaConfig],
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    HealthModule,
    DatabaseModule,
    AuthModule,
    MediaModule,
    MailModule,
    SharedModule,
  ],
  providers: [
    ...(process.env.NODE_ENV !== 'production'
      ? []
      : [
          {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
          },
        ]),
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
