import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';

export interface GetMeQuery {
  userId: string;
}

export interface GetMeResult {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  birthDate: Date | null;
}

export class GetMeUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly profileRepo: ProfileRepository,
  ) {}

  async execute(query: GetMeQuery): Promise<GetMeResult> {
    const user = await this.userRepo.findById(query.userId);
    if (!user) throw new UserNotFoundError();

    const profile = await this.profileRepo.findByUserId(user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      emailVerified: user.emailVerified,
      username: profile?.username ?? null,
      displayName: profile?.displayName ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      birthDate: profile?.birthDate ?? null,
    };
  }
}
