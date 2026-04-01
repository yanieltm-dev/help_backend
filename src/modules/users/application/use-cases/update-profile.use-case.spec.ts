import { UpdateProfileUseCase } from './update-profile.use-case';
import { User, UserStatus } from '../../domain/entities/user.entity';
import { Profile } from '../../domain/entities/profile.entity';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { UsernameAlreadyExistsError } from '../../domain/errors/username-already-exists.error';

jest.mock('@/shared/utils/uuid', () => ({
  generateUuidV7: jest.fn(() => '00000000-0000-0000-0000-000000000000'),
}));

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;
  let uow: jest.Mocked<IUnitOfWork>;
  let idGenerator: jest.Mocked<IIdGenerator>;

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

    uow = {
      run: jest.fn(async <T>(work: (tx: unknown) => Promise<T>): Promise<T> => {
        return await work({} as unknown);
      }),
    } as unknown as jest.Mocked<IUnitOfWork>;

    idGenerator = {
      generate: jest.fn(() => 'generated-id'),
    } as unknown as jest.Mocked<IIdGenerator>;

    useCase = new UpdateProfileUseCase(userRepo, profileRepo, uow, idGenerator);
  });

  it('should update existing profile', async () => {
    const user = User.create(
      'user-id-1',
      'test@example.com',
      true,
      UserStatus.ACTIVE,
    );
    const existingProfile = Profile.create(
      'profile-id-1',
      'user-id-1',
      'oldusername',
      'Old Name',
      'https://example.com/old-avatar.png',
      new Date('2000-01-01'),
    );

    userRepo.findById.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(existingProfile);
    profileRepo.findByUsername.mockResolvedValue(null);

    await useCase.execute({
      userId: 'user-id-1',
      username: 'newusername',
      displayName: 'New Name',
    });

    expect(profileRepo.save).toHaveBeenCalled();
    const savedProfile = profileRepo.save.mock.calls[0][0];
    expect(savedProfile.username).toBe('newusername');
    expect(savedProfile.displayName).toBe('New Name');
  });

  it('should create profile when it does not exist', async () => {
    const user = User.create(
      'user-id-1',
      'test@example.com',
      true,
      UserStatus.ACTIVE,
    );

    userRepo.findById.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(null);

    await useCase.execute({
      userId: 'user-id-1',
      username: 'newuser',
      displayName: 'New User',
    });

    expect(profileRepo.save).toHaveBeenCalled();
    const savedProfile = profileRepo.save.mock.calls[0][0];
    expect(savedProfile.username).toBe('newuser');
    expect(savedProfile.displayName).toBe('New User');
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    userRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'non-existent-id',
        username: 'newuser',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('should throw UserAlreadyExistsError when username is taken by another user', async () => {
    const user = User.create(
      'user-id-1',
      'test@example.com',
      true,
      UserStatus.ACTIVE,
    );
    const existingProfile = Profile.create(
      'profile-id-1',
      'user-id-1',
      'oldusername',
      'Old Name',
      null,
      new Date('2000-01-01'),
    );
    const anotherProfile = Profile.create(
      'profile-id-2',
      'user-id-2',
      'takenusername',
      'Another User',
      null,
      new Date('2000-01-01'),
    );

    userRepo.findById.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(existingProfile);
    profileRepo.findByUsername.mockResolvedValue(anotherProfile);

    await expect(
      useCase.execute({
        userId: 'user-id-1',
        username: 'takenusername',
      }),
    ).rejects.toThrow(UsernameAlreadyExistsError);
  });

  it('should allow updating to same username', async () => {
    const user = User.create(
      'user-id-1',
      'test@example.com',
      true,
      UserStatus.ACTIVE,
    );
    const existingProfile = Profile.create(
      'profile-id-1',
      'user-id-1',
      'myusername',
      'My Name',
      null,
      new Date('2000-01-01'),
    );

    userRepo.findById.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(existingProfile);
    profileRepo.findByUsername.mockResolvedValue(existingProfile);

    await useCase.execute({
      userId: 'user-id-1',
      username: 'myusername',
    });

    expect(profileRepo.save).toHaveBeenCalled();
  });
});
