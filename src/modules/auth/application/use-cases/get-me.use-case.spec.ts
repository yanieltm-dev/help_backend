import { GetMeUseCase } from './get-me.use-case';

import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import { User } from '../../domain/entities/user.entity';
import { Profile } from '../../domain/entities/profile.entity';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';

describe('GetMeUseCase', () => {
  let useCase: GetMeUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;

  beforeEach(() => {
    userRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    profileRepo = {
      findByUsername: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ProfileRepository>;

    useCase = new GetMeUseCase(userRepo, profileRepo);
  });

  it('should return current user information', async () => {
    const user = User.create('user-id', 'me@example.com', 'Me', true);
    const profile = Profile.create(
      'profile-id',
      user.id,
      'me',
      'Me',
      'https://example.com/avatar.png',
      new Date('2000-01-01'),
    );

    userRepo.findById.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(profile);

    await expect(useCase.execute({ userId: user.id })).resolves.toEqual({
      id: user.id,
      name: user.name,
      email: user.email.value,
      image: profile.avatarUrl,
      emailVerified: true,
    });
  });

  it('should return image as null when profile is missing', async () => {
    const user = User.create('user-id', 'me@example.com', 'Me', true);

    userRepo.findById.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(null);

    await expect(useCase.execute({ userId: user.id })).resolves.toEqual({
      id: user.id,
      name: user.name,
      email: user.email.value,
      image: null,
      emailVerified: true,
    });
  });

  it('should throw UserNotFoundError if user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'missing' })).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
