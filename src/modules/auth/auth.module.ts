import { AllConfigType } from '@/core/config/config.type';
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
  PROFILE_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
  VERIFICATION_REPOSITORY,
} from './auth.tokens';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { registerAuthDomainErrors } from './infrastructure/http/errors/auth-error-registration';
import { MinAgeRegistrationConstraint } from './infrastructure/http/validators/min-age-registration.validator';
import { PasswordResetRequestedListener } from './infrastructure/listeners/password-reset-requested.listener';
import { UserRegisteredListener } from './infrastructure/listeners/user-registered.listener';
import { VerificationResendedListener } from './infrastructure/listeners/verification-resended.listener';
import { DrizzleAccountRepository } from './infrastructure/persistence/repositories/drizzle-account.repository';
import { DrizzleProfileRepository } from './infrastructure/persistence/repositories/drizzle-profile.repository';
import { DrizzleSessionRepository } from './infrastructure/persistence/repositories/drizzle-session.repository';
import { DrizzleUserRepository } from './infrastructure/persistence/repositories/drizzle-user.repository';
import { DrizzleVerificationRepository } from './infrastructure/persistence/repositories/drizzle-verification.repository';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';
import { JwtAuthenticator } from './infrastructure/security/jwt-authenticator';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';

@Module({
  imports: [
    SharedModule,
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
  ],
})
export class AuthModule {
  constructor() {
    registerAuthDomainErrors();
  }
}
