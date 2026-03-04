import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { Authenticator } from '../ports/authenticator.port';
import { Session } from '../../domain/entities/session.entity';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';

export interface RefreshSessionCommand {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshSessionResponse {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
}

export type RefreshSessionUseCaseConfig = {
  sessionExpiresInMs: number;
};

export class RefreshSessionUseCase {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly userRepo: UserRepository,
    private readonly authenticator: Authenticator,
    private readonly config: RefreshSessionUseCaseConfig,
  ) {}

  async execute(
    command: RefreshSessionCommand,
  ): Promise<RefreshSessionResponse> {
    const { refreshToken, ipAddress, userAgent } = command;

    const session = await this.sessionRepo.findByToken(refreshToken);
    if (!session) {
      throw new InvalidRefreshTokenError();
    }

    if (session.isExpired()) {
      await this.sessionRepo.deleteByToken(refreshToken);
      throw new InvalidRefreshTokenError();
    }

    let payload: { sub: string; email: string };
    try {
      payload = await this.authenticator.verifyRefreshToken(refreshToken);
    } catch {
      throw new InvalidRefreshTokenError();
    }

    const {
      accessToken,
      accessTokenExpiresAt,
      refreshToken: newRefreshToken,
    } = await this.authenticator.generateTokens({
      sub: payload.sub,
      email: payload.email,
    });

    const newExpiresAt = new Date(Date.now() + this.config.sessionExpiresInMs);
    const updatedSession = Session.create(
      session.id,
      session.userId,
      newRefreshToken,
      newExpiresAt,
      ipAddress ?? session.ipAddress,
      userAgent ?? session.userAgent,
    );

    await this.sessionRepo.save(updatedSession);

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken: newRefreshToken,
    };
  }
}
