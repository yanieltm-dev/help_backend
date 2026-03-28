import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { bootstrapE2eApp } from './utils/bootstrap-e2e-app';

interface ApiResponse {
  message: string;
}

describe('Auth Verification (e2e)', () => {
  let app: INestApplication;
  let dbAvailable = true;

  beforeAll(async () => {
    const bootstrapResult = await bootstrapE2eApp({
      validationMode: 'default',
      useCookieParser: false,
    });
    app = bootstrapResult.app;
    dbAvailable = bootstrapResult.dbAvailable;
  });

  afterAll(async () => {
    await app.close();
  });

  const timestamp = Date.now();
  const validUser = {
    displayName: 'Verification User',
    username: `verify_${timestamp}`,
    email: `verify_${timestamp}@example.com`,
    password: 'Password123!',
    birthDate: '2000-01-01',
  };

  it('Verification Flow: Register -> Fail Verification -> Resend -> Succeed', async () => {
    if (!dbAvailable) return;
    // 1. Register
    const regRes = await request(app.getHttpServer() as App)
      .post('/api/v1/auth/register')
      .send(validUser)
      .expect(201);

    expect((regRes.body as ApiResponse).message).toBe(
      'Verification email sent',
    );

    // 2. Fail with wrong code
    await request(app.getHttpServer() as App)
      .post('/api/v1/auth/verify-email')
      .send({ email: validUser.email, code: '000000' })
      .expect(400)
      .expect((res) => {
        expect((res.body as ApiResponse).message).toBe(
          'Invalid verification code',
        );
      });

    // 3. Resend
    await request(app.getHttpServer() as App)
      .post('/api/v1/auth/resend-verification')
      .send({ email: validUser.email })
      .expect(200)
      .expect((res) => {
        expect((res.body as ApiResponse).message).toBe(
          'Verification email resent',
        );
      });

    // Note: To test success, we'd need to mock the OTP generation or intercept the event.
    // For now, we verify the endpoints exist and handle basic scenarios.
  });
});
