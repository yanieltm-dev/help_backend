export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
}

export interface Authenticator {
  generateTokens(payload: { sub: string; email: string }): Promise<AuthTokens>;
  verifyToken(token: string): Promise<{ sub: string; email: string }>;
  verifyRefreshToken(token: string): Promise<{ sub: string; email: string }>;
}
