import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  Authenticator,
  AuthTokens,
} from '../../application/ports/authenticator.port';
import { AllConfigType } from '@/core/config/config.type';
import { randomUUID } from 'node:crypto';

@Injectable()
export class JwtAuthenticator implements Authenticator {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async generateTokens(payload: {
    sub: string;
    email: string;
  }): Promise<AuthTokens> {
    const jti = randomUUID();
    const tokenPayload = { ...payload, jti };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload),
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.getOrThrow('auth.refreshSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.refreshExpiresIn', {
          infer: true,
        }),
      }),
    ]);

    const decoded = this.jwtService.decode<{ exp: number }>(accessToken);
    const accessTokenExpiresAt = new Date(decoded.exp * 1000);

    return {
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
    };
  }

  async verifyToken(token: string): Promise<{ sub: string; email: string }> {
    return this.jwtService.verifyAsync(token);
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<{ sub: string; email: string }> {
    const secret = this.configService.getOrThrow('auth.refreshSecret', {
      infer: true,
    });
    return this.jwtService.verifyAsync(token, { secret });
  }
}
