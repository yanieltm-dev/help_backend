import { AllConfigType } from '@/core/config/config.type';
import { UsersModule } from '@/modules/users/users.module';
import { SharedModule } from '@/shared/shared.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { authUseCaseProviders } from './auth-use-cases.providers';
import {
  ACCOUNT_REPOSITORY,
  AUTHENTICATOR,
  PASSWORD_HASHER,
  SESSION_REPOSITORY,
  VERIFICATION_REPOSITORY,
} from './auth.tokens';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { CookieService } from './infrastructure/http/services/cookie.service';
import { registerAuthDomainErrors } from './infrastructure/http/errors/auth-error-registration';
import { MinAgeRegistrationConstraint } from './infrastructure/http/validators/min-age-registration.validator';
import { PasswordResetRequestedListener } from './infrastructure/listeners/password-reset-requested.listener';
import { UserRegisteredListener } from './infrastructure/listeners/user-registered.listener';
import { VerificationResendedListener } from './infrastructure/listeners/verification-resended.listener';
import { DrizzleAccountRepository } from './infrastructure/persistence/repositories/drizzle-account.repository';
import { DrizzleSessionRepository } from './infrastructure/persistence/repositories/drizzle-session.repository';
import { DrizzleVerificationRepository } from './infrastructure/persistence/repositories/drizzle-verification.repository';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';
import { JwtAuthenticator } from './infrastructure/security/jwt-authenticator';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';

@Module({
  imports: [
    SharedModule,
    PassportModule,
    UsersModule,
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
    CookieService,
    MinAgeRegistrationConstraint,
    UserRegisteredListener,
    VerificationResendedListener,
    PasswordResetRequestedListener,
    JwtStrategy,
    { provide: ACCOUNT_REPOSITORY, useClass: DrizzleAccountRepository },
    {
      provide: VERIFICATION_REPOSITORY,
      useClass: DrizzleVerificationRepository,
    },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: AUTHENTICATOR, useClass: JwtAuthenticator },
    { provide: SESSION_REPOSITORY, useClass: DrizzleSessionRepository },
  ],
  exports: [ACCOUNT_REPOSITORY, SESSION_REPOSITORY, VERIFICATION_REPOSITORY],
})
export class AuthModule {
  constructor() {
    registerAuthDomainErrors();
  }
}
