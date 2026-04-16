import { Pool } from 'pg';
import { ApiClient, createApiClient } from './utils/api-client';
import { buildUserFixture, registerAndActivateUser } from './utils/db-helpers';
import { cleanDatabase } from './utils/e2e-setup';
import {
  getApp,
  getPool,
  initializeTestContext,
  teardownTestContext,
} from './utils/test-context';
import {
  ApiResponse,
  GenericMessageBody,
  LoginResponseBody,
} from './utils/types';

describe('AuthController (e2e)', () => {
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

  const validUser = buildUserFixture();

  describe('/api/v1/auth/register (POST)', () => {
    it('Scenario 1: Successful registration', async () => {
      const res = await api.post('/auth/register').send(validUser).expect(201);
      const body = res.body as ApiResponse;
      expect(body).toHaveProperty('message', 'Verification email sent');
      expect(body).toHaveProperty('userId');
    });

    it('Scenario 2: Email already registered', async () => {
      await api.post('/auth/register').send(validUser).expect(201);

      const res = await api
        .post('/auth/register')
        .send({
          ...validUser,
          username: `other_${Date.now()}`,
        })
        .expect(409);

      expect((res.body as ApiResponse).message).toBe(
        'Email already registered',
      );
    });

    it('Scenario 3: Username already registered', async () => {
      await api.post('/auth/register').send(validUser).expect(201);

      const res = await api
        .post('/auth/register')
        .send({
          ...validUser,
          email: `other_${Date.now()}@example.com`,
        })
        .expect(409);

      expect((res.body as ApiResponse).message).toBe(
        'Username is not available',
      );
    });

    it('Scenario 4: User too young (under 13)', async () => {
      const youngUser = buildUserFixture({
        birthDate: new Date().toISOString().split('T')[0],
      });

      const res = await api.post('/auth/register').send(youngUser).expect(422);
      const body = res.body as ApiResponse;
      expect(body.message).toBe('Validation failed');

      const birthDateErrors = body.errors?.birthDate;
      expect(birthDateErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringMatching(
              /You must be at least \d+ years old to register/,
            ) as unknown as string,
          }),
        ]),
      );
    });

    it('Scenario 5: Invalid data (invalid email)', async () => {
      const res = await api
        .post('/auth/register')
        .send({ ...validUser, email: 'not-an-email' })
        .expect(422);

      const body = res.body as ApiResponse;
      expect(body.errors).toHaveProperty('email');
    });

    it('Scenario 6: Invalid data (weak password)', async () => {
      const res = await api
        .post('/auth/register')
        .send({ ...validUser, password: '123' })
        .expect(422);

      const body = res.body as ApiResponse;
      expect(body.errors).toHaveProperty('password');
    });
  });

  describe('Auth refresh and logout flow (e2e)', () => {
    it('Scenario 1: Valid refresh rotates tokens', async () => {
      const { accessToken: originalAt, cookies } =
        await registerAndActivateUser(api, pool);

      const res = await api
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      const body = res.body as LoginResponseBody;
      expect(body.accessToken).toBeDefined();
      expect(body.accessToken).not.toBe(originalAt);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('Scenario 2: Refresh after logout returns 401', async () => {
      const { cookies } = await registerAndActivateUser(api, pool);

      await api.post('/auth/logout').set('Cookie', cookies).expect(200);

      await api.post('/auth/refresh').set('Cookie', cookies).expect(401);
    });

    it('Scenario 3: Logout clears refresh cookie', async () => {
      const { cookies } = await registerAndActivateUser(api, pool);

      const res = await api
        .post('/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      const logoutCookies = res.headers['set-cookie'] as unknown as string[];
      expect(logoutCookies.some((c) => c.startsWith('refresh_token='))).toBe(
        true,
      );
    });
  });

  describe('Password reset flow (e2e)', () => {
    it('Scenario 1: Request password reset returns 200 even if email does not exist', async () => {
      const res = await api
        .post('/auth/request-password-reset')
        .send({ email: `unknown_${Date.now()}@example.com` })
        .expect(200);

      expect((res.body as GenericMessageBody).message).toBe(
        'If an account with this email exists, a password reset code has been sent.',
      );
    });

    it('Scenario 2: Verify password reset OTP with invalid OTP returns 400', async () => {
      const user = buildUserFixture();
      await api.post('/auth/register').send(user).expect(201);

      await api
        .post('/auth/verify-password-reset-otp')
        .send({ email: user.email, otp: '000000' })
        .expect(400);
    });

    it('Scenario 3: When password change fails, refresh with old token still works', async () => {
      const { cookies } = await registerAndActivateUser(api, pool);

      await api
        .post('/auth/change-password-with-token')
        .send({
          changePasswordToken: 'invalid-token-format',
          newPassword: 'NewPassword123!',
        })
        .expect(400);

      await api.post('/auth/refresh').set('Cookie', cookies).expect(200);
    });
  });

  describe('Change password flow (e2e)', () => {
    it('Scenario 1: Changes password and revokes other sessions but keeps current', async () => {
      const {
        user,
        accessToken: firstAt,
        cookies: firstCookies,
      } = await registerAndActivateUser(api, pool);

      // Second login
      const secondLoginRes = await api
        .post('/auth/login')
        .send({ emailOrUsername: user.email, password: user.password })
        .expect(200);
      const secondCookies = secondLoginRes.headers[
        'set-cookie'
      ] as unknown as string[];

      // Change password
      await api
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${firstAt}`)
        .set('Cookie', firstCookies)
        .send({
          currentPassword: user.password,
          newPassword: 'NewPassword123!',
        })
        .expect(200);

      // Current session still works
      await api.post('/auth/refresh').set('Cookie', firstCookies).expect(200);

      // Other session is revoked
      await api.post('/auth/refresh').set('Cookie', secondCookies).expect(401);
    });

    it('Scenario 2: Wrong current password returns 400', async () => {
      const { accessToken, cookies } = await registerAndActivateUser(api, pool);

      await api
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', cookies)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        })
        .expect(400);
    });

    it('Scenario 3: Invalid new password returns 422', async () => {
      const { accessToken, cookies } = await registerAndActivateUser(api, pool);

      await api
        .patch('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', cookies)
        .send({
          currentPassword: 'Password123!',
          newPassword: '123',
        })
        .expect(422);
    });
  });
});
