import { Profile } from '../entities/profile.entity';

export interface ProfileRepository {
  findByUsername(username: string): Promise<Profile | null>;
  save(profile: Profile, tx?: any): Promise<void>;
}
