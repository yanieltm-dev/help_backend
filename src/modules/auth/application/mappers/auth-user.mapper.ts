import type { Profile } from '../../domain/entities/profile.entity';
import { User } from '../../domain/entities/user.entity';

export interface AuthUserResponse {
  id: string;
  userName: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export function buildAuthUserResponse(
  user: User,
  profile: Profile | null,
  emailVerified?: boolean,
): AuthUserResponse {
  return {
    id: user.id,
    userName: profile?.username || '',
    displayName: profile?.displayName || '',
    email: user.email.value,
    avatarUrl: profile?.avatarUrl ?? null,
    emailVerified: emailVerified ?? user.emailVerified,
  };
}
