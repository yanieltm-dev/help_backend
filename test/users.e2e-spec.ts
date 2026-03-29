import { INestApplication } from '@nestjs/common';
import { Pool } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapE2eApp } from './utils/bootstrap-e2e-app';

type LoginResponseBody = {
  accessToken: string;
  accessTokenExpiresAt: string;
  user?: {
    id: string;
    userName: string;
    email: string;
    image: string | null;
    emailVerified: boolean;
  };
};

let app: INestApplication;
let dbAvailable = true;

beforeAll(async () => {
  const bootstrapResult = await bootstrapE2eApp({
    validationMode: 'production',
    useCookieParser: true,
  });
  app = bootstrapResult.app;
  dbAvailable = bootstrapResult.dbAvailable;
});

afterAll(async () => {
  if (app) {
    await app.close();
  }
});

const timestamp = Date.now();
const validUser = {
  displayName: 'Test User',
  username: `testuser_${timestamp}`,
  email: `test_${timestamp}@example.com`,
  password: 'Password123!',
  birthDate: '2000-01-01',
};

describe('GET /api/v1/users/me', () => {
  it('Scenario 1: GET /me without token returns 401', async () => {
    if (!dbAvailable) return;

    await request(app.getHttpServer() as App)
      .get('/api/v1/users/me')
      .expect(401);
  });

  it('Scenario 2: GET /me with access token returns current user', async () => {
    if (!dbAvailable) return;

    const ts = Date.now();
    const user = {
      ...validUser,
      username: `meuser_${ts}`,
      email: `me_${ts}@example.com`,
    };

    await request(app.getHttpServer() as App)
      .post('/api/v1/auth/register')
      .send(user)
      .expect(201);

    const databaseUrl = process.env.DATABASE_URL;
    expect(databaseUrl).toBeDefined();

    const pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 1000,
    });
    await pool.query(
      'update "user" set email_verified = true, status = \'active\' where email = $1',
      [user.email.toLowerCase()],
    );
    await pool.end();

    const loginResponse = await request(app.getHttpServer() as App)
      .post('/api/v1/auth/login')
      .send({
        emailOrUsername: user.email,
        password: user.password,
      })
      .expect(200);

    const accessToken = (loginResponse.body as LoginResponseBody).accessToken;
    expect(accessToken).toBeDefined();

    await request(app.getHttpServer() as App)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('displayName', user.displayName);
        expect(res.body).toHaveProperty('email', user.email.toLowerCase());
        expect(res.body).toHaveProperty('avatarUrl');
        expect(res.body).toHaveProperty('emailVerified', true);
      });
  });
});
