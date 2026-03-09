import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { parseDuration } from '@/shared/utils/parse-duration';

import type { Authenticator } from '@/modules/auth/application/ports/authenticator.port';
import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';
import type { UserRepository } from '@/modules/auth/domain/ports/user.repository.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';

type CreateRefreshSessionUseCaseSutOverrides = Partial<
  Readonly<{
    sessionRepo: jest.Mocked<SessionRepository>;
    userRepo: jest.Mocked<UserRepository>;
    authenticator: jest.Mocked<Authenticator>;
  }>
>;

type RefreshSessionUseCaseSut = Readonly<{
  useCase: RefreshSessionUseCase;
  sessionRepo: jest.Mocked<SessionRepository>;
  authenticator: jest.Mocked<Authenticator>;
}>;

export function createRefreshSessionUseCaseSut(
  overrides: CreateRefreshSessionUseCaseSutOverrides = {},
): RefreshSessionUseCaseSut {
  const defaultSessionRepo: jest.Mocked<SessionRepository> =
    AuthUseCaseTestKit.createSessionRepositoryMock();
  const defaultUserRepo: jest.Mocked<UserRepository> =
    AuthUseCaseTestKit.createUserRepositoryMock();
  const defaultAuthenticator: jest.Mocked<Authenticator> =
    AuthUseCaseTestKit.createAuthenticatorMock();
  const resolvedSessionRepo: jest.Mocked<SessionRepository> =
    overrides.sessionRepo ?? defaultSessionRepo;
  const resolvedUserRepo: jest.Mocked<UserRepository> =
    overrides.userRepo ?? defaultUserRepo;
  const resolvedAuthenticator: jest.Mocked<Authenticator> =
    overrides.authenticator ?? defaultAuthenticator;
  return {
    useCase: new RefreshSessionUseCase(
      resolvedSessionRepo,
      resolvedUserRepo,
      resolvedAuthenticator,
      {
        sessionExpiresInMs: parseDuration('1h'),
      },
    ),
    sessionRepo: resolvedSessionRepo,
    authenticator: resolvedAuthenticator,
  };
}
