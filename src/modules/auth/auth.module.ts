import { Module } from '@nestjs/common';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { authUseCaseProviders } from './auth-use-cases.providers';
import { MinAgeRegistrationConstraint } from './infrastructure/http/dto/validators/min-age-registration.validator';
import { UserRegisteredListener } from './infrastructure/listeners/user-registered.listener';
import { VerificationResendedListener } from './infrastructure/listeners/verification-resended.listener';
import { PasswordResetRequestedListener } from './infrastructure/listeners/password-reset-requested.listener';
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
import { registerAuthDomainErrors } from './infrastructure/http/errors/auth-error-registration';
import { UNIT_OF_WORK, ID_GENERATOR } from '@/shared/shared.tokens';
import { DrizzleUnitOfWork } from '@/shared/infrastructure/persistence/drizzle-unit-of-work.adapter';
import { UuidV7Generator } from '@/shared/infrastructure/services/uuid-v7-generator.adapter';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';

@Module({
  imports: [
    PassportModule,
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
    ...authUseCaseProviders,
    MinAgeRegistrationConstraint,
    UserRegisteredListener,
    VerificationResendedListener,
    PasswordResetRequestedListener,
    JwtStrategy,
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
    { provide: UNIT_OF_WORK, useClass: DrizzleUnitOfWork },
    { provide: ID_GENERATOR, useClass: UuidV7Generator },
  ],
})
export class AuthModule {
  constructor() {
    registerAuthDomainErrors();
  }
}
