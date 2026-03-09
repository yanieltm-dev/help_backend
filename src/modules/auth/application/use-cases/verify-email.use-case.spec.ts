import { VerifyEmailUseCase } from './verify-email.use-case';

import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { Authenticator } from '../ports/authenticator.port';
import type { SessionRepository } from '../../domain/ports/session.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { AuthEntitiesTestFactory } from './test-utils/auth-entities-test-factory';
import { createVerifyEmailUseCaseSut } from './test-utils/sut/create-verify-email-use-case-sut';
import { parseDuration } from '@/shared/utils/parse-duration';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let authenticator: jest.Mocked<Authenticator>;
  let sessionRepo: jest.Mocked<SessionRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;
  let idGenerator: jest.Mocked<IIdGenerator>;

  beforeEach(() => {
    const sut = createVerifyEmailUseCaseSut();
    useCase = sut.useCase;
    userRepo = sut.userRepo;
    verificationRepo = sut.verificationRepo;
    hasher = sut.hasher;
    authenticator = sut.authenticator;
    sessionRepo = sut.sessionRepo;
    profileRepo = sut.profileRepo;
    idGenerator = sut.idGenerator;
  });

  it('should verify email, create session and return tokens when otp is valid', async () => {
    const email = 'test@example.com';
    const code = '123456';
    const user = AuthEntitiesTestFactory.createUser({
      id: 'user-id',
      email,
      name: 'Test User',
      isEmailVerified: false,
    });
    const verification = AuthEntitiesTestFactory.createVerificationToken({
      id: 'verification-id',
      identifier: email,
      type: 'email_verification',
      expiresInMs: parseDuration('1h'),
    });
    const profile = AuthEntitiesTestFactory.createProfile({
      id: 'profile-id',
      userId: user.id,
      username: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
      birthDate: new Date('2000-01-01'),
    });

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
