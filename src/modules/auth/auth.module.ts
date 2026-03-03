import { Module } from '@nestjs/common';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { UserRegisteredListener } from './infrastructure/listeners/user-registered.listener';
import { DrizzleUserRepository } from './infrastructure/persistence/repositories/drizzle-user.repository';
import { DrizzleAccountRepository } from './infrastructure/persistence/repositories/drizzle-account.repository';
import { DrizzleProfileRepository } from './infrastructure/persistence/repositories/drizzle-profile.repository';
import { DrizzleVerificationRepository } from './infrastructure/persistence/repositories/drizzle-verification.repository';
import { DrizzleSessionRepository } from './infrastructure/persistence/repositories/drizzle-session.repository';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';
import { JwtAuthenticator } from './infrastructure/security/jwt-authenticator';
import {
  ACCOUNT_REPOSITORY,
  EVENT_BUS,
  PASSWORD_HASHER,
  PROFILE_REPOSITORY,
  SESSION_REPOSITORY,
  AUTHENTICATOR,
  USER_REPOSITORY,
  VERIFICATION_REPOSITORY,
} from './auth.tokens';
import { NestEventBusAdapter } from '@/shared/infrastructure/events/nest-event-bus.adapter';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/core/config/config.type';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        secret: configService.getOrThrow('auth.jwtSecret', { infer: true }),
        signOptions: {
          expiresIn: configService.getOrThrow('auth.jwtExpiresIn', {
            infer: true,
          }),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    VerifyEmailUseCase,
    ResendVerificationUseCase,
    LoginUseCase,
    UserRegisteredListener,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: ACCOUNT_REPOSITORY, useClass: DrizzleAccountRepository },
    { provide: PROFILE_REPOSITORY, useClass: DrizzleProfileRepository },
    {
      provide: VERIFICATION_REPOSITORY,
      useClass: DrizzleVerificationRepository,
    },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: AUTHENTICATOR, useClass: JwtAuthenticator },
    { provide: SESSION_REPOSITORY, useClass: DrizzleSessionRepository },
    { provide: EVENT_BUS, useClass: NestEventBusAdapter },
  ],
})
export class AuthModule {}
