import { AllConfigType } from '@/core/config/config.type';
import { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { EVENT_BUS, ID_GENERATOR, UNIT_OF_WORK } from '@/shared/shared.tokens';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Authenticator } from './application/ports/authenticator.port';
import type { PasswordHasher } from './application/ports/password-hasher.port';
import { ChangePasswordWithTokenUseCase } from './application/use-cases/change-password-with-token.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshSessionUseCase } from './application/use-cases/refresh-session.use-case';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ResendVerificationUseCase } from './application/use-cases/resend-verification.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { VerifyPasswordResetOtpUseCase } from './application/use-cases/verify-password-reset-otp.use-case';
import {
  ACCOUNT_REPOSITORY,
  AUTHENTICATOR,
  PASSWORD_HASHER,
  PROFILE_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
  VERIFICATION_REPOSITORY,
} from './auth.tokens';
import { AccountRepository } from './domain/ports/account.repository.port';
import { ProfileRepository } from './domain/ports/profile.repository.port';
import { SessionRepository } from './domain/ports/session.repository.port';
import { UserRepository } from './domain/ports/user.repository.port';
import { VerificationRepository } from './domain/ports/verification.repository.port';

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
      PROFILE_REPOSITORY,
      VERIFICATION_REPOSITORY,
      PASSWORD_HASHER,
      EVENT_BUS,
      ID_GENERATOR,
      ConfigService,
    ],
    useFactory: (
      userRepo: UserRepository,
      profileRepo: ProfileRepository,
      verificationRepo: VerificationRepository,
      hasher: PasswordHasher,
      eventBus: IEventBus,
      idGenerator: IIdGenerator,
      configService: ConfigService<AllConfigType>,
    ) => {
      return new RequestPasswordResetUseCase(
        userRepo,
        profileRepo,
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
    provide: VerifyPasswordResetOtpUseCase,
    inject: [
      VERIFICATION_REPOSITORY,
      PASSWORD_HASHER,
      ID_GENERATOR,
      ConfigService,
    ],
    useFactory: (
      verificationRepo: VerificationRepository,
      hasher: PasswordHasher,
      idGenerator: IIdGenerator,
      configService: ConfigService<AllConfigType>,
    ) => {
      return new VerifyPasswordResetOtpUseCase(
        verificationRepo,
        hasher,
        idGenerator,
        {
          changePasswordTokenExpiresInMs: configService.getOrThrow(
            'auth.changePasswordTokenExpiresInMs',
            { infer: true },
          ),
          otpMaxAttempts: configService.getOrThrow('auth.otpMaxAttempts', {
            infer: true,
          }),
        },
      );
    },
  },
  {
    provide: ChangePasswordWithTokenUseCase,
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
      return new ChangePasswordWithTokenUseCase(
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
          otpMaxAttempts: configService.getOrThrow('auth.otpMaxAttempts', {
            infer: true,
          }),
        },
      );
    },
  },
  {
    provide: ResendVerificationUseCase,
    inject: [
      USER_REPOSITORY,
      PROFILE_REPOSITORY,
      VERIFICATION_REPOSITORY,
      PASSWORD_HASHER,
      EVENT_BUS,
      ID_GENERATOR,
      ConfigService,
    ],
    useFactory: (
      userRepo: UserRepository,
      profileRepo: ProfileRepository,
      verificationRepo: VerificationRepository,
      hasher: PasswordHasher,
      eventBus: IEventBus,
      idGenerator: IIdGenerator,
      configService: ConfigService<AllConfigType>,
    ) => {
      return new ResendVerificationUseCase(
        userRepo,
        profileRepo,
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
      UNIT_OF_WORK,
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
      uow: IUnitOfWork,
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
        uow,
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
