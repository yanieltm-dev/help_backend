import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { AllConfigType } from '@/core/config/config.type';

@Injectable()
export class CookieService {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  setRefreshToken(res: Response, token: string): void {
    const maxAge = this.configService.getOrThrow('auth.sessionExpiresInMs', {
      infer: true,
    });

    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge,
    });
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  getRefreshToken(req: Request): string | undefined {
    const cookiesUnknown = (req as Request & { cookies?: unknown }).cookies;
    if (!cookiesUnknown || typeof cookiesUnknown !== 'object') {
      return undefined;
    }
    const value = (cookiesUnknown as Record<string, unknown>)['refresh_token'];
    return typeof value === 'string' ? value : undefined;
  }
}
