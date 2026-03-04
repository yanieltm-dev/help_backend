import type { SessionRepository } from '../../domain/ports/session.repository.port';

export interface LogoutCommand {
  refreshToken: string;
}

export class LogoutUseCase {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(command: LogoutCommand): Promise<void> {
    const { refreshToken } = command;

    if (!refreshToken) {
      return;
    }

    await this.sessionRepo.deleteByToken(refreshToken);
  }
}
