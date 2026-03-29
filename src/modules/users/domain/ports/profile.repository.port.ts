import type { Profile } from '../entities/profile.entity';

export interface ProfileRepository {
  findByUsername(username: string): Promise<Profile | null>;
  findByUserId(userId: string): Promise<Profile | null>;
  save(profile: Profile, tx?: unknown): Promise<void>;
}
