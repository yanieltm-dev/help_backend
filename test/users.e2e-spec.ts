import { INestApplication } from '@nestjs/common';
import { Pool } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapE2eApp } from './utils/bootstrap-e2e-app';

interface ApiResponse {
  message: string;
  userId?: string;
  errors?: Record<string, string[]>;
}

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

type MeResponseBody = {
  id: string;
  email: string;
  emailVerified: boolean;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  birthDate: string | null;
};

describe('UsersController (e2e)', () => {
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

  describe('PATCH /api/v1/users/me', () => {
    it('Scenario 1: Update profile successfully', async () => {
      if (!dbAvailable) return;

      const ts = Date.now();
      const user = {
        ...validUser,
        username: `update_${ts}`,
        email: `update_${ts}@example.com`,
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

      const accessToken = (loginResponse.body as { accessToken: string })
        .accessToken;
      expect(accessToken).toBeDefined();

      const updateResponse = await request(app.getHttpServer() as App)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          displayName: 'Updated Name',
          userName: `updateduser_${ts}`,
        })
        .expect(200);

      const body = updateResponse.body as MeResponseBody;
      expect(body.displayName).toBe('Updated Name');
      expect(body.username).toBe(`updateduser_${ts}`);
    });

    it('Scenario 2: Duplicate username returns 409', async () => {
      if (!dbAvailable) return;

      const ts = Date.now();
      const user1 = {
        ...validUser,
        username: `user1_${ts}`,
        email: `user1_${ts}@example.com`,
      };

      const user2 = {
        ...validUser,
        username: `user2_${ts}`,
        email: `user2_${ts}@example.com`,
      };

      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send(user1)
        .expect(201);

      await request(app.getHttpServer() as App)
        .post('/api/v1/auth/register')
        .send(user2)
        .expect(201);

      const databaseUrl = process.env.DATABASE_URL;
      expect(databaseUrl).toBeDefined();

      const pool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 1000,
      });
      await pool.query(
        'update "user" set email_verified = true, status = \'active\' where email = $1',
        [user2.email.toLowerCase()],
      );
      await pool.end();

      const loginResponse = await request(app.getHttpServer() as App)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: user2.email,
          password: user2.password,
        })
        .expect(200);

      const accessToken = (loginResponse.body as { accessToken: string })
        .accessToken;

      await request(app.getHttpServer() as App)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userName: user1.username,
        })
        .expect(409)
        .expect((res) => {
          expect((res.body as ApiResponse).message).toBe(
            'Username is not available',
          );
        });
    });

    it('Scenario 3: Without token returns 401', async () => {
      if (!dbAvailable) return;

      await request(app.getHttpServer() as App)
        .patch('/api/v1/users/me')
        .send({
          displayName: 'Hacker Name',
        })
        .expect(401);
    });

    it('Scenario 4: Verify updated fields in GET /me', async () => {
      if (!dbAvailable) return;

      const ts = Date.now();
      const user = {
        ...validUser,
        username: `verify_${ts}`,
        email: `verify_${ts}@example.com`,
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

      const accessToken = (loginResponse.body as { accessToken: string })
        .accessToken;

      await request(app.getHttpServer() as App)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          displayName: 'New Display Name',
          avatarUrl: 'https://example.com/new-avatar.png',
        })
        .expect(200);

      const getResponse = await request(app.getHttpServer() as App)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = getResponse.body as MeResponseBody;
      expect(body.displayName).toBe('New Display Name');
      expect(body.avatarUrl).toBe('https://example.com/new-avatar.png');
    });
  });
});
