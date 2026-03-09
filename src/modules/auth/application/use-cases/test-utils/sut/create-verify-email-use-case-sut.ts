import { VerifyEmailUseCase } from '@/modules/auth/application/use-cases/verify-email.use-case';
import { parseDuration } from '@/shared/utils/parse-duration';

import type { Authenticator } from '@/modules/auth/application/ports/authenticator.port';
import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.port';
import type { ProfileRepository } from '@/modules/auth/domain/ports/profile.repository.port';
import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';
import type { UserRepository } from '@/modules/auth/domain/ports/user.repository.port';
import type { VerificationRepository } from '@/modules/auth/domain/ports/verification.repository.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';

type CreateVerifyEmailUseCaseSutOverrides = Partial<
  Readonly<{
    userRepo: jest.Mocked<UserRepository>;
    verificationRepo: jest.Mocked<VerificationRepository>;
    hasher: jest.Mocked<PasswordHasher>;
    uow: jest.Mocked<IUnitOfWork>;
    authenticator: jest.Mocked<Authenticator>;
    sessionRepo: jest.Mocked<SessionRepository>;
    profileRepo: jest.Mocked<ProfileRepository>;
    idGenerator: jest.Mocked<IIdGenerator>;
  }>
>;

type VerifyEmailUseCaseSut = Readonly<{
  useCase: VerifyEmailUseCase;
  userRepo: jest.Mocked<UserRepository>;
  verificationRepo: jest.Mocked<VerificationRepository>;
  hasher: jest.Mocked<PasswordHasher>;
  authenticator: jest.Mocked<Authenticator>;
  sessionRepo: jest.Mocked<SessionRepository>;
  profileRepo: jest.Mocked<ProfileRepository>;
  idGenerator: jest.Mocked<IIdGenerator>;
}>;

export function createVerifyEmailUseCaseSut(
  overrides: CreateVerifyEmailUseCaseSutOverrides = {},
): VerifyEmailUseCaseSut {
  const defaultUserRepo: jest.Mocked<UserRepository> =
    AuthUseCaseTestKit.createUserRepositoryMock();
  const defaultVerificationRepo: jest.Mocked<VerificationRepository> =
    AuthUseCaseTestKit.createVerificationRepositoryMock();
  const defaultHasher: jest.Mocked<PasswordHasher> =
    AuthUseCaseTestKit.createPasswordHasherMock();
  const defaultUow: jest.Mocked<IUnitOfWork> =
    AuthUseCaseTestKit.createUnitOfWorkMock();
  const defaultAuthenticator: jest.Mocked<Authenticator> =
    AuthUseCaseTestKit.createAuthenticatorMock();
  const defaultSessionRepo: jest.Mocked<SessionRepository> =
    AuthUseCaseTestKit.createSessionRepositoryMock();
  const defaultProfileRepo: jest.Mocked<ProfileRepository> =
    AuthUseCaseTestKit.createProfileRepositoryMock();
  const defaultIdGenerator: jest.Mocked<IIdGenerator> =
    AuthUseCaseTestKit.createIdGeneratorMock();
  const resolvedUserRepo: jest.Mocked<UserRepository> =
    overrides.userRepo ?? defaultUserRepo;
  const resolvedVerificationRepo: jest.Mocked<VerificationRepository> =
    overrides.verificationRepo ?? defaultVerificationRepo;
  const resolvedHasher: jest.Mocked<PasswordHasher> =
    overrides.hasher ?? defaultHasher;
  const resolvedUow: jest.Mocked<IUnitOfWork> = overrides.uow ?? defaultUow;
  const resolvedAuthenticator: jest.Mocked<Authenticator> =
    overrides.authenticator ?? defaultAuthenticator;
  const resolvedSessionRepo: jest.Mocked<SessionRepository> =
    overrides.sessionRepo ?? defaultSessionRepo;
  const resolvedProfileRepo: jest.Mocked<ProfileRepository> =
    overrides.profileRepo ?? defaultProfileRepo;
  const resolvedIdGenerator: jest.Mocked<IIdGenerator> =
    overrides.idGenerator ?? defaultIdGenerator;
  return {
    useCase: new VerifyEmailUseCase(
      resolvedUserRepo,
      resolvedVerificationRepo,
      resolvedHasher,
      resolvedUow,
      resolvedAuthenticator,
      resolvedSessionRepo,
      resolvedProfileRepo,
      resolvedIdGenerator,
      { sessionExpiresInMs: parseDuration('1h') },
    ),
    userRepo: resolvedUserRepo,
    verificationRepo: resolvedVerificationRepo,
    hasher: resolvedHasher,
    authenticator: resolvedAuthenticator,
    sessionRepo: resolvedSessionRepo,
    profileRepo: resolvedProfileRepo,
    idGenerator: resolvedIdGenerator,
  };
}
