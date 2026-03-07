import { Account } from '@/modules/auth/domain/entities/account.entity';
import { Profile } from '@/modules/auth/domain/entities/profile.entity';
import { Session } from '@/modules/auth/domain/entities/session.entity';
import { User } from '@/modules/auth/domain/entities/user.entity';
import { VerificationToken } from '@/modules/auth/domain/entities/verification-token.entity';
import { Password } from '@/modules/auth/domain/value-objects/password.vo';

type CreateUserOverrides = Readonly<{
  id?: string;
  email?: string;
  name?: string;
  isEmailVerified?: boolean;
}>;

type CreateProfileOverrides = Readonly<{
  id?: string;
  userId: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
  birthDate?: Date;
}>;

type CreateAccountOverrides = Readonly<{
  id?: string;
  userId: string;
  email?: string;
  passwordHash?: string;
}>;

type CreateVerificationTokenOverrides = Readonly<{
  id?: string;
  identifier: string;
  hashedToken?: string;
  type: 'email_verification' | 'password_reset';
  expiresInMs?: number;
}>;

type CreateSessionOverrides = Readonly<{
  id?: string;
  userId: string;
  token?: string;
  expiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}>;

type AuthEntitiesTestFactoryType = Readonly<{
  createUser: (overrides?: CreateUserOverrides) => User;
  createProfile: (overrides: CreateProfileOverrides) => Profile;
  createCredentialsAccount: (overrides: CreateAccountOverrides) => Account;
  createVerificationToken: (
    overrides: CreateVerificationTokenOverrides,
  ) => VerificationToken;
  createSession: (overrides: CreateSessionOverrides) => Session;
}>;

export const AuthEntitiesTestFactory: AuthEntitiesTestFactoryType = {
  createUser: (overrides: CreateUserOverrides = {}): User => {
    const id: string = overrides.id ?? 'user-id';
    const email: string = overrides.email ?? 'user@example.com';
    const name: string = overrides.name ?? 'Test User';
    const isEmailVerified: boolean = overrides.isEmailVerified ?? true;
    return User.create(id, email, name, isEmailVerified);
  },
  createProfile: (overrides: CreateProfileOverrides): Profile => {
    const id: string = overrides.id ?? 'profile-id';
    const username: string = overrides.username ?? 'testuser';
    const name: string = overrides.name ?? 'Test User';
    const avatarUrl: string =
      overrides.avatarUrl ?? 'https://example.com/avatar.png';
    const birthDate: Date = overrides.birthDate ?? new Date('2000-01-01');
    return Profile.create(
      id,
      overrides.userId,
      username,
      name,
      avatarUrl,
      birthDate,
    );
  },
  createCredentialsAccount: (overrides: CreateAccountOverrides): Account => {
    const id: string = overrides.id ?? 'account-id';
    const email: string = overrides.email ?? 'user@example.com';
    const passwordHash: string = overrides.passwordHash ?? 'hashed-password';
    return Account.createCredentials(
      id,
      overrides.userId,
      email,
      Password.createFromHash(passwordHash),
    );
  },
  createVerificationToken: (
    overrides: CreateVerificationTokenOverrides,
  ): VerificationToken => {
    const id: string = overrides.id ?? 'verification-id';
    const hashedToken: string = overrides.hashedToken ?? 'hashed-otp';
    const expiresInMs: number = overrides.expiresInMs ?? 600000;
    return VerificationToken.create(
      id,
      overrides.identifier,
      hashedToken,
      overrides.type,
      expiresInMs,
    );
  },
  createSession: (overrides: CreateSessionOverrides): Session => {
    const id: string = overrides.id ?? 'session-id';
    const token: string = overrides.token ?? 'refresh-token';
    const expiresAt: Date =
      overrides.expiresAt ?? new Date(Date.now() + 3600000);
    const ipAddress: string = overrides.ipAddress ?? '127.0.0.1';
    const userAgent: string = overrides.userAgent ?? 'jest';
    return Session.create(
      id,
      overrides.userId,
      token,
      expiresAt,
      ipAddress,
      userAgent,
    );
  },
} as const;
