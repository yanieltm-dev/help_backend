export interface ApiResponse {
  message: string;
  userId?: string;
  errors?: Record<
    string,
    Array<{ message: string; meta?: Record<string, unknown> }>
  >;
}

export type LoginResponseBody = {
  accessToken: string;
  accessTokenExpiresAt: string;
  user?: {
    id: string;
    username: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
  };
};

export type MeResponseBody = {
  id: string;
  email: string;
  emailVerified: boolean;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
};

export type GenericMessageBody = {
  message: string;
};
