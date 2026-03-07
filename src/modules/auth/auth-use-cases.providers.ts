import { Provider } from '@nestjs/common';
import type { UserRepository } from './domain/ports/user.repository.port';
import type { AccountRepository } from './domain/ports/account.repository.port';
import type { ProfileRepository } from './domain/ports/profile.repository.port';
import type { VerificationRepository } from './domain/ports/verification.repository.port';
import type { SessionRepository } from './domain/ports/session.repository.port';
import type { PasswordHasher } from './application/ports/password-hasher.port';
import type { Authenticator } from './application/ports/authenticator.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/core/config/config.type';
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
import { UNIT_OF_WORK, ID_GENERATOR } from '@/shared/shared.tokens';

export const authUseCaseProviders: Provider[] = [
  {
    provide: RegisterUserUseCase,
    inject: [
      USER_REPOSITORY,
      ACCOUNT_REPOSITORY,
      PROFILE_REPOSITORY,
      VERIFICATION_REPOSITORY,
      PASSWORD_HASHER,
      UNIT_OF_WORK,
      ID_GENERATOR,
      EVENT_BUS,
      ConfigService,
    ],
    useFactory: (
      userRepo: UserRepository,
      accountRepo: AccountRepository,
      profileRepo: ProfileRepository,
      verificationRepo: VerificationRepository,
      hasher: PasswordHasher,
      uow: IUnitOfWork,
      idGenerator: IIdGenerator,
      eventBus: IEventBus,
      configService: ConfigService<AllConfigType>,
    ) => {
      return new RegisterUserUseCase(
        userRepo,
        accountRepo,
        profileRepo,
        verificationRepo,
        hasher,
        uow,
        idGenerator,
        eventBus,
        {
          otpExpiresInMs: configService.getOrThrow('auth.otpExpiresInMs', {
            infer: true,
          }),
        },
      );
    },
  },
  {
    provide: RequestPasswordResetUseCase,
    inject: [
      USER_REPOSITORY,
      VERIFICATION_REPOSITORY,
      PASSWORD_HASHER,
      EVENT_BUS,
      ID_GENERATOR,
      ConfigService,
    ],
    useFactory: (
      userRepo: UserRepository,
      verificationRepo: VerificationRepository,
      hasher: PasswordHasher,
      eventBus: IEventBus,
      idGenerator: IIdGenerator,
      configService: ConfigService<AllConfigType>,
    ) => {
      return new RequestPasswordResetUseCase(
        userRepo,
        verificationRepo,
        hasher,
        eventBus,
        idGenerator,
        {
          otpExpiresInMs: configService.getOrThrow('auth.otpExpiresInMs', {
            infer: true,
          }),
          maxRequests: configService.getOrThrow('auth.maxFailedAttempts', {
            infer: true,
          }),
          windowMs: configService.getOrThrow('auth.lockoutDurationMs', {
            infer: true,
          }),
        },
      );
    },
  },
  {
    provide: ResetPasswordUseCase,
    inject: [
      VERIFICATION_REPOSITORY,
      USER_REPOSITORY,
      ACCOUNT_REPOSITORY,
      SESSION_REPOSITORY,
      PASSWORD_HASHER,
      UNIT_OF_WORK,
    ],
    useFactory: (
      verificationRepo: VerificationRepository,
      userRepo: UserRepository,
      accountRepo: AccountRepository,
      sessionRepo: SessionRepository,
      hasher: PasswordHasher,
      uow: IUnitOfWork,
    ) => {
      return new ResetPasswordUseCase(
        verificationRepo,
        userRepo,
        accountRepo,
        sessionRepo,
        hasher,
        uow,
      );
    },
  },
  {
    provide: VerifyEmailUseCase,
    inject: [
      USER_REPOSITORY,
      VERIFICATION_REPOSITORY,
      PASSWORD_HASHER,
      UNIT_OF_WORK,
      AUTHENTICATOR,
      SESSION_REPOSITORY,
      PROFILE_REPOSITORY,
      ID_GENERATOR,
      ConfigService,
    ],
    useFactory: (
      userRepo: UserRepository,
      verificationRepo: VerificationRepository,
      hasher: PasswordHasher,
      uow: IUnitOfWork,
      authenticator: Authenticator,
      sessionRepo: SessionRepository,
      profileRepo: ProfileRepository,
      idGenerator: IIdGenerator,
      configService: ConfigService<AllConfigType>,
    ) => {
      return new VerifyEmailUseCase(
        userRepo,
        verificationRepo,
        hasher,
        uow,
        authenticator,
        sessionRepo,
        profileRepo,
        idGenerator,
        {
          sessionExpiresInMs: configService.getOrThrow(
            'auth.sessionExpiresInMs',
            {
              infer: true,
            },
          ),
        },
      );
    },
  },
  {
    provide: ResendVerificationUseCase,
    inject: [
      USER_REPOSITORY,
      VERIFICATION_REPOSITORY,
      PASSWORD_HASHER,
      EVENT_BUS,
      ID_GENERATOR,
      ConfigService,
    ],
    useFactory: (
      userRepo: UserRepository,
      verificationRepo: VerificationRepository,
      hasher: PasswordHasher,
      eventBus: IEventBus,
      idGenerator: IIdGenerator,
      configService: ConfigService<AllConfigType>,
    ) => {
      return new ResendVerificationUseCase(
        userRepo,
        verificationRepo,
        hasher,
        eventBus,
        idGenerator,
        {
          otpExpiresInMs: configService.getOrThrow('auth.otpExpiresInMs', {
            infer: true,
          }),
          maxRequests: configService.getOrThrow(
            'auth.resendVerificationMaxRequests',
            {
              infer: true,
            },
          ),
          windowMs: configService.getOrThrow(
            'auth.resendVerificationWindowMs',
            {
              infer: true,
            },
          ),
        },
      );
    },
  },
  {
    provide: LoginUseCase,
    inject: [
      USER_REPOSITORY,
      ACCOUNT_REPOSITORY,
      PROFILE_REPOSITORY,
      PASSWORD_HASHER,
      AUTHENTICATOR,
      SESSION_REPOSITORY,
      ID_GENERATOR,
      ConfigService,
    ],
    useFactory: (
      userRepo: UserRepository,
      accountRepo: AccountRepository,
      profileRepo: ProfileRepository,
      hasher: PasswordHasher,
      authenticator: Authenticator,
      sessionRepo: SessionRepository,
      idGenerator: IIdGenerator,
      configService: ConfigService<AllConfigType>,
    ) => {
      return new LoginUseCase(
        userRepo,
        accountRepo,
        profileRepo,
        hasher,
        authenticator,
        sessionRepo,
        idGenerator,
        {
          maxFailedAttempts: configService.getOrThrow(
            'auth.maxFailedAttempts',
            { infer: true },
          ),
          lockoutDurationMs: configService.getOrThrow(
            'auth.lockoutDurationMs',
            { infer: true },
          ),
          sessionExpiresInMs: configService.getOrThrow(
            'auth.sessionExpiresInMs',
            { infer: true },
          ),
        },
      );
    },
  },
  {
    provide: RefreshSessionUseCase,
    inject: [SESSION_REPOSITORY, USER_REPOSITORY, AUTHENTICATOR, ConfigService],
    useFactory: (
      sessionRepo: SessionRepository,
      userRepo: UserRepository,
      authenticator: Authenticator,
      configService: ConfigService<AllConfigType>,
    ) =>
      new RefreshSessionUseCase(sessionRepo, userRepo, authenticator, {
        sessionExpiresInMs: configService.getOrThrow(
          'auth.sessionExpiresInMs',
          { infer: true },
        ),
      }),
  },
  {
    provide: LogoutUseCase,
    inject: [SESSION_REPOSITORY],
    useFactory: (sessionRepo: SessionRepository) => {
      return new LogoutUseCase(sessionRepo);
    },
  },
  {
    provide: GetMeUseCase,
    inject: [USER_REPOSITORY, PROFILE_REPOSITORY],
    useFactory: (userRepo: UserRepository, profileRepo: ProfileRepository) => {
      return new GetMeUseCase(userRepo, profileRepo);
    },
  },
  {
    provide: ChangePasswordUseCase,
    inject: [
      ACCOUNT_REPOSITORY,
      SESSION_REPOSITORY,
      PASSWORD_HASHER,
      UNIT_OF_WORK,
    ],
    useFactory: (
      accountRepo: AccountRepository,
      sessionRepo: SessionRepository,
      hasher: PasswordHasher,
      uow: IUnitOfWork,
    ) => {
      return new ChangePasswordUseCase(accountRepo, sessionRepo, hasher, uow);
    },
  },
];
