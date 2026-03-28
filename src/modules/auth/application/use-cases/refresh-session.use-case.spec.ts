import { RefreshSessionUseCase } from '@/modules/auth/application/use-cases/refresh-session.use-case';

import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';
import type { Authenticator } from '@/modules/auth/application/ports/authenticator.port';
import { Session } from '@/modules/auth/domain/entities/session.entity';
import { InvalidRefreshTokenError } from '@/modules/auth/domain/errors/invalid-refresh-token.error';
import { createRefreshSessionUseCaseSut } from './test-utils/sut/create-refresh-session-use-case-sut';
import { parseDuration } from '@/shared/utils/parse-duration';

describe('RefreshSessionUseCase', () => {
  let useCase: RefreshSessionUseCase;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let authenticator: jest.Mocked<Authenticator>;

  const now = new Date();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    const sut = createRefreshSessionUseCaseSut();
    useCase = sut.useCase;
    sessionRepo = sut.sessionRepo;
    authenticator = sut.authenticator;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should rotate refresh token and return new tokens when session and token are valid', async () => {
    const oldRefreshToken = 'old-refresh-token';
    const userId = 'user-id';
    const email = 'test@example.com';

    const existingSession = Session.create(
      'session-id',
      userId,
      oldRefreshToken,
      new Date(now.getTime() + parseDuration('1h')),
      '127.0.0.1',
      'jest-agent',
    );

    sessionRepo.findByToken.mockResolvedValue(existingSession);
    authenticator.verifyRefreshToken.mockResolvedValue({ sub: userId, email });

    const newAccessToken = 'new-access-token';
    const newRefreshToken = 'new-refresh-token';
    const newAccessTokenExpiresAt = new Date(
      now.getTime() + parseDuration('15m'),
    );

    authenticator.generateTokens.mockResolvedValue({
      accessToken: newAccessToken,
      accessTokenExpiresAt: newAccessTokenExpiresAt,
      refreshToken: newRefreshToken,
    });

    const result = await useCase.execute({
      refreshToken: oldRefreshToken,
      ipAddress: '127.0.0.1',
      userAgent: 'jest-agent',
    });

    expect(result).toEqual({
      accessToken: newAccessToken,
      accessTokenExpiresAt: newAccessTokenExpiresAt,
      refreshToken: newRefreshToken,
    });

    expect(sessionRepo.findByToken).toHaveBeenCalledWith(oldRefreshToken);

    expect(authenticator.verifyRefreshToken).toHaveBeenCalledWith(
      oldRefreshToken,
    );

    expect(authenticator.generateTokens).toHaveBeenCalledWith({
      sub: userId,
      email,
    });

    expect(sessionRepo.save).toHaveBeenCalled();
    const savedSession = sessionRepo.save.mock.calls[0][0];
    expect(savedSession.id).toBe(existingSession.id);
    expect(savedSession.token).toBe(newRefreshToken);
    expect(savedSession.expiresAt.getTime()).toBe(now.getTime() + 3600000);
  });

  it('should throw InvalidRefreshTokenError when session is not found', async () => {
    sessionRepo.findByToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'missing-token' }),
    ).rejects.toThrow(InvalidRefreshTokenError);
  });

  it('should throw InvalidRefreshTokenError and delete session when session is expired', async () => {
    const expiredSession = Session.create(
      'session-id',
      'user-id',
      'expired-token',
      new Date(now.getTime() - 1000),
    );

    sessionRepo.findByToken.mockResolvedValue(expiredSession);

    await expect(
      useCase.execute({ refreshToken: 'expired-token' }),
    ).rejects.toThrow(InvalidRefreshTokenError);

    expect(sessionRepo.deleteByToken).toHaveBeenCalledWith('expired-token');
  });

  it('should throw InvalidRefreshTokenError when refresh token verification fails', async () => {
    const refreshToken = 'invalid-refresh-token';
    const session = Session.create(
      'session-id',
      'user-id',
      refreshToken,
      new Date(now.getTime() + parseDuration('1h')),
    );

    sessionRepo.findByToken.mockResolvedValue(session);
    authenticator.verifyRefreshToken.mockRejectedValue(
      new Error('invalid token'),
    );

    await expect(useCase.execute({ refreshToken })).rejects.toThrow(
      InvalidRefreshTokenError,
    );
  });
});
