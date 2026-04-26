import { Pool } from 'pg';
import { ApiClient, createApiClient } from './utils/api-client';
import { registerAndActivateUser } from './utils/db-helpers';
import { cleanDatabase } from './utils/e2e-setup';
import {
  getApp,
  getPool,
  initializeTestContext,
  teardownTestContext,
} from './utils/test-context';
import { ApiResponse, MeResponseBody } from './utils/types';

describe('UsersController (e2e)', () => {
  let api: ApiClient;
  let pool: Pool;

  beforeAll(async () => {
    await initializeTestContext();
    api = createApiClient(getApp());
    pool = getPool();
  });

  afterEach(async () => {
    await cleanDatabase(pool);
  });

  afterAll(async () => {
    await teardownTestContext();
  });

  describe('GET /api/v1/users/me', () => {
    it('Scenario 1: GET /me without token returns 401', async () => {
      await api.get('/users/me').expect(401);
    });

    it('Scenario 2: GET /me with access token returns current user', async () => {
      const { user, accessToken } = await registerAndActivateUser(api, pool);

      const res = await api
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as MeResponseBody;
      expect(body).toHaveProperty('id');
      expect(body.displayName).toBe(user.displayName);
      expect(body.email).toBe(user.email.toLowerCase());
      expect(body.emailVerified).toBe(true);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('Scenario 1: Update profile successfully', async () => {
      const { accessToken } = await registerAndActivateUser(api, pool);

      const updateRes = await api
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          displayName: 'Updated Name',
          username: `updateduser_${Date.now()}`,
        })
        .expect(200);

      const body = updateRes.body as MeResponseBody;
      expect(body.displayName).toBe('Updated Name');
      expect(body.username).toMatch(/^updateduser_/);
    });

    it('Scenario 2: Duplicate username returns 409', async () => {
      const { user: user1 } = await registerAndActivateUser(api, pool);
      const { accessToken: at2 } = await registerAndActivateUser(api, pool);

      const res = await api
        .patch('/users/me')
        .set('Authorization', `Bearer ${at2}`)
        .send({
          username: user1.username,
        })
        .expect(409);

      expect((res.body as ApiResponse).message).toBe(
        'Username is not available',
      );
    });

    it('Scenario 3: Without token returns 401', async () => {
      await api.patch('/users/me').send({ displayName: 'Hacker' }).expect(401);
    });

    it('Scenario 4: Verify updated fields in GET /me', async () => {
      const { accessToken } = await registerAndActivateUser(api, pool);

      await api
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          displayName: 'New Display Name',
          avatarUrl: 'https://example.com/new-avatar.png',
        })
        .expect(200);

      const res = await api
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = res.body as MeResponseBody;
      expect(body.displayName).toBe('New Display Name');
      expect(body.avatarUrl).toBe('https://example.com/new-avatar.png');
    });
  });
});
