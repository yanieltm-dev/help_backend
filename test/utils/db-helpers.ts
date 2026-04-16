import { Pool } from 'pg';
import { ApiClient, extractCookies } from './api-client';
import { LoginResponseBody } from './types';

/**
 * Fixture data for a test user.
 */
export interface UserFixture {
  displayName: string;
  username: string;
  email: string;
  password: string;
  birthDate: string;
}

/**
 * Builds a user fixture with unique data based on current timestamp.
 */
export function buildUserFixture(
  overrides?: Partial<UserFixture>,
): UserFixture {
  const timestamp = Date.now();
  return {
    displayName: 'Test User',
    username: `testuser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'Password123!',
    birthDate: '2000-01-01',
    ...overrides,
  };
}

/**
 * Activates a user by marking their email as verified and setting status to 'active'.
 */
export async function activateUser(pool: Pool, email: string): Promise<void> {
  await pool.query(
    'UPDATE "user" SET email_verified = true, status = \'active\' WHERE email = $1',
    [email.toLowerCase()],
  );
}

/**
 * Higher level helper: register, activate in DB, and login.
 * Returns tokens and cookies.
 */
export async function registerAndActivateUser(
  api: ApiClient,
  pool: Pool,
  overrides?: Partial<UserFixture>,
): Promise<{ user: UserFixture; accessToken: string; cookies: string[] }> {
  const user = buildUserFixture(overrides);

  // 1. Register
  await api.post('/auth/register').send(user).expect(201);

  // 2. Activate
  await activateUser(pool, user.email);

  // 3. Login
  const loginRes = await api
    .post('/auth/login')
    .send({
      emailOrUsername: user.email,
      password: user.password,
    })
    .expect(200);

  const body = loginRes.body as LoginResponseBody;

  return {
    user,
    accessToken: body.accessToken,
    cookies: extractCookies(loginRes),
  };
}
