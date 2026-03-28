import { LogoutUseCase } from '@/modules/auth/application/use-cases/logout.use-case';

import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';
import { AuthUseCaseTestKit } from './test-utils/auth-use-case-test-kit';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let sessionRepo: jest.Mocked<SessionRepository>;

  beforeEach(() => {
    sessionRepo = AuthUseCaseTestKit.createSessionRepositoryMock();

    useCase = new LogoutUseCase(sessionRepo);
  });

  it('should delete session when refresh token is provided', async () => {
    await useCase.execute({ refreshToken: 'refresh-token' });

    expect(sessionRepo.deleteByToken).toHaveBeenCalledWith('refresh-token');
  });

  it('should be idempotent when refresh token is missing', async () => {
    await useCase.execute({ refreshToken: '' });

    expect(sessionRepo.deleteByToken).not.toHaveBeenCalled();
  });
});
