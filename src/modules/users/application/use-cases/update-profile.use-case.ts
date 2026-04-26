import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import { Profile } from '../../domain/entities/profile.entity';
import { UsernameAlreadyExistsError } from '../../domain/errors/username-already-exists.error';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';

export interface UpdateProfileCommand {
  userId: string;
  username?: string;
  displayName?: string;
  birthDate?: Date;
  avatarUrl?: string | null;
  bio?: string | null;
}

export class UpdateProfileUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly uow: IUnitOfWork,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<void> {
    const user = await this.userRepo.findById(command.userId);
    if (!user) throw new UserNotFoundError();

    const profile = await this.profileRepo.findByUserId(user.id);

    if (command.username) {
      const existingProfile = await this.profileRepo.findByUsername(
        command.username,
      );
      if (existingProfile && existingProfile.userId !== user.id) {
        throw new UsernameAlreadyExistsError();
      }
    }

    await this.uow.run(async (tx) => {
      if (!profile) {
        const newProfile = Profile.create(
          this.idGenerator.generate(),
          user.id,
          command.username || `user_${user.id.slice(0, 8)}`,
          command.displayName || 'User',
          command.avatarUrl ?? null,
          command.birthDate ?? new Date(),
          command.bio ?? null,
        );
        await this.profileRepo.save(newProfile, tx);
      } else {
        const updatedProfile = profile.update({
          username: command.username,
          displayName: command.displayName,
          birthDate: command.birthDate,
          avatarUrl: command.avatarUrl,
          bio: command.bio,
        });
        await this.profileRepo.save(updatedProfile, tx);
      }
    });
  }
}
