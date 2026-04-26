import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';
import { parseDuration } from '@/shared/utils/parse-duration';

import type { Authenticator } from '@/modules/auth/application/ports/authenticator.port';
import { AuthUseCaseTestKit } from '@/modules/auth/application/use-cases/test-utils/auth-use-case-test-kit';
import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';

type CreateRefreshSessionUseCaseSutOverrides = Partial<
  Readonly<{
    sessionRepo: jest.Mocked<SessionRepository>;
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
  const defaultAuthenticator: jest.Mocked<Authenticator> =
    AuthUseCaseTestKit.createAuthenticatorMock();
  const resolvedSessionRepo: jest.Mocked<SessionRepository> =
    overrides.sessionRepo ?? defaultSessionRepo;
  const resolvedAuthenticator: jest.Mocked<Authenticator> =
    overrides.authenticator ?? defaultAuthenticator;
  return {
    useCase: new RefreshSessionUseCase(
      resolvedSessionRepo,
      resolvedAuthenticator,
      {
        sessionExpiresInMs: parseDuration('1h'),
      },
    ),
    sessionRepo: resolvedSessionRepo,
    authenticator: resolvedAuthenticator,
  };
}
