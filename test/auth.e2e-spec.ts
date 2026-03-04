import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpStatus,
  INestApplication,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/core/config/config.type';
import { App } from 'supertest/types';
import { Pool } from 'pg';

interface ApiResponse {
  message: string;
  userId?: string;
  errors?: Record<string, string[]>;
}

type LoginResponseBody = {
  accessToken: string;
  accessTokenExpiresAt: string;
};

function getSetCookieHeader(res: {
  headers: Record<string, unknown>;
}): string[] {
  const header = res.headers['set-cookie'];
  if (!header) return [];
  if (Array.isArray(header)) return header as string[];
  if (typeof header === 'string') return [header];
  return [];
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dbAvailable = true;

  beforeAll(async () => {
    let databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      dbAvailable = false;
      databaseUrl = 'postgresql://user:secret@127.0.0.1:5432/api';
      process.env.DATABASE_URL = databaseUrl;
    } else {
      try {
        const pool = new Pool({
          connectionString: databaseUrl,
          connectionTimeoutMillis: 1000,
        });
        await pool.query('select 1');
        await pool.end();
      } catch {
        dbAvailable = false;
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const configService = app.get(ConfigService<AllConfigType>);
    const apiPrefix = configService.getOrThrow('app.apiPrefix', {
      infer: true,
    });

    app.setGlobalPrefix(apiPrefix);
    app.enableVersioning({
      type: VersioningType.URI,
    });

    // Replicate production ValidationPipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        exceptionFactory: (errors: ValidationError[]) => {
          const formatErrors = (
            errors: ValidationError[],
            parentProperty: string = '',
          ) => {
            return errors.reduce((acc: Record<string, string[]>, error) => {
              const property = parentProperty
                ? `${parentProperty}.${error.property}`
                : error.property;

              if (error.constraints) {
                acc[property] = Object.values(error.constraints);
              }

              if (error.children && error.children.length > 0) {
                Object.assign(acc, formatErrors(error.children, property));
              }

              return acc;
            }, {});
          };

          return new UnprocessableEntityException({
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'Validation failed',
            errors: formatErrors(errors),
          });
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const timestamp = Date.now();
  const validUser = {
    name: 'Test User',
    username: `testuser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'Password123!',
    birthDate: '2000-01-01',
  };

  describe('/api/v1/auth/register (POST)', () => {
    it('Scenario 1: Successful registration', async () => {
      if (!dbAvailable) return;
      return request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201)
        .expect((res) => {
          const body = res.body as ApiResponse;
          expect(body).toHaveProperty('message', 'Verification email sent');
          expect(body).toHaveProperty('userId');
        });
    });

    it('Scenario 2: Email already registered', async () => {
      if (!dbAvailable) return;
      return request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          username: `other_${timestamp}`, // Different username, same email
        })
        .expect(409)
        .expect((res) => {
          expect((res.body as ApiResponse).message).toBe(
            'Email already registered',
          );
        });
    });

    it('Scenario 3: Username already registered', async () => {
      if (!dbAvailable) return;
      return request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          email: `other_${timestamp}@example.com`, // Different email, same username
        })
        .expect(409)
        .expect((res) => {
          expect((res.body as ApiResponse).message).toBe(
            'Username is not available',
          );
        });
    });

    it('Scenario 4: User too young (under 13)', () => {
      const youngUser = {
        ...validUser,
        username: `young_${timestamp}`,
        email: `young_${timestamp}@example.com`,
        birthDate: new Date().toISOString().split('T')[0], // Born today
      };

      return request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send(youngUser)
        .expect(422)
        .expect((res) => {
          const body = res.body as ApiResponse;
          expect(body.message).toBe('Validation failed');
          expect(body.errors?.birthDate).toContain(
            'You must be at least 13 years old to register',
          );
        });
    });

    it('Scenario 5: Invalid data (invalid email)', () => {
      return request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          email: 'not-an-email',
        })
        .expect(422)
        .expect((res) => {
          const body = res.body as ApiResponse;
          expect(body.message).toBe('Validation failed');
          expect(body.errors).toHaveProperty('email');
        });
    });

    it('Scenario 5: Invalid data (weak password)', () => {
      return request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          password: '123',
        })
        .expect(422)
        .expect((res) => {
          const body = res.body as ApiResponse;
          expect(body.message).toBe('Validation failed');
          expect(body.errors).toHaveProperty('password');
        });
    });
  });

  describe('Auth refresh and logout flow (e2e)', () => {
    it('Scenario 1: Valid refresh rotates tokens', async () => {
      if (!dbAvailable) return;
      // Register user
      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201);

      // Login to obtain tokens and refresh cookie
      const loginResponse = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: validUser.email,
          password: validUser.password,
        })
        .expect(200);

      const originalAccessToken = (loginResponse.body as LoginResponseBody)
        .accessToken;
      const cookies = getSetCookieHeader(
        loginResponse as unknown as {
          headers: Record<string, unknown>;
        },
      );
      expect(cookies).toBeDefined();

      // Use refresh endpoint with cookie
      const refreshResponse = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      const refreshedAccessToken = (refreshResponse.body as LoginResponseBody)
        .accessToken;
      expect(refreshedAccessToken).toBeDefined();
      expect(refreshedAccessToken).not.toBe(originalAccessToken);
      expect(refreshResponse.headers['set-cookie']).toBeDefined();
    });

    it('Scenario 2: Refresh after logout returns 401', async () => {
      if (!dbAvailable) return;
      // Register and login again with unique email/username
      const ts = Date.now();
      const user = {
        ...validUser,
        username: `refreshuser_${ts}`,
        email: `refresh_${ts}@example.com`,
      };

      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send(user)
        .expect(201);

      const loginResponse = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: user.email,
          password: user.password,
        })
        .expect(200);

      const cookies = getSetCookieHeader(
        loginResponse as unknown as {
          headers: Record<string, unknown>;
        },
      );

      // Logout to revoke refresh token
      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      // Attempt refresh with same cookie should now fail with 401
      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies)
        .expect(401);
    });

    it('Scenario 3: Logout clears refresh cookie', async () => {
      if (!dbAvailable) return;
      const ts = Date.now();
      const user = {
        ...validUser,
        username: `logoutuser_${ts}`,
        email: `logout_${ts}@example.com`,
      };

      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send(user)
        .expect(201);

      const loginResponse = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: user.email,
          password: user.password,
        })
        .expect(200);

      const cookies = getSetCookieHeader(
        loginResponse as unknown as {
          headers: Record<string, unknown>;
        },
      );

      const logoutResponse = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      const logoutCookies = getSetCookieHeader(
        logoutResponse as unknown as {
          headers: Record<string, unknown>;
        },
      );
      expect(
        (logoutCookies ?? []).some((c) => c.startsWith('refresh_token=')),
      ).toBe(true);
    });
  });
});
