import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthenticator } from './jwt-authenticator';

describe('JwtAuthenticator', () => {
  let authenticator: JwtAuthenticator;

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'auth.refreshSecret') return 'refresh-secret';
      if (key === 'auth.refreshExpiresIn') return '7d';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthenticator,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authenticator = module.get<JwtAuthenticator>(JwtAuthenticator);
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens with expiration date', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com' };
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      const now = Math.floor(Date.now() / 1000);
      const exp = now + 900; // 15 minutes

      mockJwtService.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);

      mockJwtService.decode.mockReturnValue({ exp });

      const result = await authenticator.generateTokens(payload);

      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
      expect(result.accessTokenExpiresAt).toBeInstanceOf(Date);
      expect(result.accessTokenExpiresAt.getTime()).toBe(exp * 1000);

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockJwtService.decode).toHaveBeenCalledWith(accessToken);
    });
  });
});
