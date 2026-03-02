import { Module } from '@nestjs/common';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { UserRegisteredListener } from './infrastructure/listeners/user-registered.listener';
import { DrizzleUserRepository } from './infrastructure/persistence/repositories/drizzle-user.repository';
import { DrizzleAccountRepository } from './infrastructure/persistence/repositories/drizzle-account.repository';
import { DrizzleProfileRepository } from './infrastructure/persistence/repositories/drizzle-profile.repository';
import { DrizzleVerificationRepository } from './infrastructure/persistence/repositories/drizzle-verification.repository';
import { Argon2PasswordHasher } from './infrastructure/security/argon2-password-hasher';
import {
  ACCOUNT_REPOSITORY,
  EVENT_BUS,
  PASSWORD_HASHER,
  PROFILE_REPOSITORY,
  USER_REPOSITORY,
  VERIFICATION_REPOSITORY,
} from './auth.tokens';
import { NestEventBusAdapter } from '@/shared/infrastructure/events/nest-event-bus.adapter';

@Module({
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    UserRegisteredListener,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: ACCOUNT_REPOSITORY, useClass: DrizzleAccountRepository },
    { provide: PROFILE_REPOSITORY, useClass: DrizzleProfileRepository },
    {
      provide: VERIFICATION_REPOSITORY,
      useClass: DrizzleVerificationRepository,
    },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: EVENT_BUS, useClass: NestEventBusAdapter },
  ],
})
export class AuthModule {}
