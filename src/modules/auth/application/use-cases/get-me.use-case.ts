import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';

export interface GetMeQuery {
  userId: string;
}

export interface GetMeResult {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
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
      image: profile?.avatarUrl ?? null,
      emailVerified: user.emailVerified,
    };
  }
}
