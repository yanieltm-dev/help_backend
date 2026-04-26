import { GetMeUseCase } from './get-me.use-case';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { Profile } from '../../domain/entities/profile.entity';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    userRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    profileRepo = {
      findByUsername: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ProfileRepository>;

    useCase = new GetMeUseCase(userRepo, profileRepo);
  });

  it('should return user with profile data', async () => {
    const user = User.create(
      'user-id-1',
      'test@example.com',
      true,
      UserStatus.ACTIVE,
    );
    const profile = Profile.create(
      'profile-id-1',
      'user-id-1',
      'testuser',
      'Test User',
      'https://example.com/avatar.png',
      new Date('2000-01-01'),
    );

    userRepo.findById.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(profile);

    const result = await useCase.execute({ userId: 'user-id-1' });

    expect(result).toEqual({
      id: 'user-id-1',
      email: 'test@example.com',
      emailVerified: true,
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
      birthDate: new Date('2000-01-01'),
      bio: null,
      website: null,
      location: null,
    });
  });

  it('should return user with null profile fields when profile does not exist', async () => {
    const user = User.create(
      'user-id-1',
      'test@example.com',
      true,
      UserStatus.ACTIVE,
    );

    userRepo.findById.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'user-id-1' });

    expect(result).toEqual({
      id: 'user-id-1',
      email: 'test@example.com',
      emailVerified: true,
      username: null,
      displayName: null,
      avatarUrl: null,
      birthDate: null,
      bio: null,
      website: null,
      location: null,
    });
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'non-existent-id' }),
    ).rejects.toThrow(UserNotFoundError);
  });
});
