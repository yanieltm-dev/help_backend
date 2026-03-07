import { LogoutUseCase } from '@/modules/auth/application/use-cases/logout.use-case';

import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let sessionRepo: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    sessionRepo = {
      save: jest.fn(),
      findByToken: jest.fn(),
      deleteByToken: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteByUserIdExceptToken: jest.fn(),
    } as unknown as jest.Mocked<SessionRepository>;

    useCase = new LogoutUseCase(sessionRepo);
  });

  it('should delete session when refresh token is provided', async () => {
    await useCase.execute({ refreshToken: 'refresh-token' });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessionRepo.deleteByToken).toHaveBeenCalledWith('refresh-token');
  });

  it('should be idempotent when refresh token is missing', async () => {
    await useCase.execute({ refreshToken: '' });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessionRepo.deleteByToken).not.toHaveBeenCalled();
  });
});
