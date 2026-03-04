import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  Authenticator,
  AuthTokens,
} from '../../application/ports/authenticator.port';
import { AllConfigType } from '@/core/config/config.type';

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
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
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
}
