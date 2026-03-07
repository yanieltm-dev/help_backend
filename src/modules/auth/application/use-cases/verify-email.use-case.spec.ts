import { VerifyEmailUseCase } from './verify-email.use-case';

import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import type { Authenticator } from '../ports/authenticator.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { VerificationToken } from '../../domain/entities/verification-token.entity';
import { User } from '../../domain/entities/user.entity';
import { Profile } from '../../domain/entities/profile.entity';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let uow: jest.Mocked<IUnitOfWork>;
  let authenticator: jest.Mocked<Authenticator>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;
  let idGenerator: jest.Mocked<IIdGenerator>;

  beforeEach(() => {
    userRepo = {
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    verificationRepo = {
      findByIdentifierAndType: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<VerificationRepository>;
    hasher = {
      compare: jest.fn(),
    } as unknown as jest.Mocked<PasswordHasher>;
    uow = {
      run: jest.fn(
        async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> =>
          await fn({} as unknown),
      ),
    } as unknown as jest.Mocked<IUnitOfWork>;
    authenticator = {
      generateTokens: jest.fn(),
      verifyToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<Authenticator>;
    sessionRepo = {
      save: jest.fn(),
    } as unknown as jest.Mocked<SessionRepository>;
    profileRepo = {
      findByUserId: jest.fn(),
    } as unknown as jest.Mocked<ProfileRepository>;
    idGenerator = {
      generate: jest.fn(),
    } as unknown as jest.Mocked<IIdGenerator>;

    useCase = new VerifyEmailUseCase(
      userRepo,
      verificationRepo,
      hasher,
      uow,
      authenticator,
      sessionRepo,
      profileRepo,
      idGenerator,
      { sessionExpiresInMs: 3600000 },
    );
  });

  it('should verify email, create session and return tokens when otp is valid', async () => {
    const email = 'test@example.com';
    const code = '123456';
    const user = User.create('user-id', email, 'Test User', false);
    const verification = VerificationToken.create(
      'verification-id',
      email,
      'hashed-otp',
      'email_verification',
      3600000,
    );
    const profile = Profile.create(
      'profile-id',
      user.id,
      'testuser',
      'Test User',
      'https://example.com/avatar.png',
      new Date('2000-01-01'),
    );

    verificationRepo.findByIdentifierAndType.mockResolvedValue(verification);
    hasher.compare.mockResolvedValue(true);
    userRepo.findByEmail.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(profile);
    idGenerator.generate.mockReturnValue('session-id');

    const accessTokenExpiresAt = new Date();
    authenticator.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      accessTokenExpiresAt,
      refreshToken: 'refresh-token',
    });

    const result = await useCase.execute({
      email,
      code,
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      accessTokenExpiresAt,
      refreshToken: 'refresh-token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email.value,
        image: profile.avatarUrl,
        emailVerified: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(authenticator.generateTokens).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email.value,
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessionRepo.save).toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(userRepo.save).toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.delete).toHaveBeenCalledWith(verification.id);
  });
});
