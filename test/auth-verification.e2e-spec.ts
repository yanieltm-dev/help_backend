import { ApiClient, createApiClient } from './utils/api-client';
import { buildUserFixture } from './utils/db-helpers';
import { cleanDatabase } from './utils/e2e-setup';
import {
  getApp,
  getPool,
  initializeTestContext,
  teardownTestContext,
} from './utils/test-context';
import { ApiResponse } from './utils/types';

describe('Auth Verification (e2e)', () => {
  let api: ApiClient;

  beforeAll(async () => {
    await initializeTestContext();
    api = createApiClient(getApp());
  });

  afterEach(async () => {
    await cleanDatabase(getPool());
  });

  afterAll(async () => {
    await teardownTestContext();
  });

  const validUser = buildUserFixture();

  it('Verification Flow: Register -> Fail Verification -> Resend -> Succeed', async () => {
    // 1. Register
    const regRes = await api.post('/auth/register').send(validUser).expect(201);
    expect((regRes.body as ApiResponse).message).toBe(
      'Verification email sent',
    );

    // 2. Fail with wrong code
    const failRes = await api
      .post('/auth/verify-email')
      .send({ email: validUser.email, code: '000000' })
      .expect(400);

    expect((failRes.body as ApiResponse).message).toBe(
      'Invalid verification code',
    );

    // 3. Resend
    const resendRes = await api
      .post('/auth/resend-verification')
      .send({ email: validUser.email })
      .expect(200);

    expect((resendRes.body as ApiResponse).message).toBe(
      'Verification email resent',
    );
  });
});
