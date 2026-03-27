import { User } from '../../domain/entities/user.entity';
import type { Profile } from '../../domain/entities/profile.entity';

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
}

export function buildAuthUserResponse(
  user: User,
  profile: Profile | null,
  emailVerified?: boolean,
): AuthUserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email.value,
    image: profile?.avatarUrl ?? null,
    emailVerified: emailVerified ?? user.emailVerified,
  };
}
