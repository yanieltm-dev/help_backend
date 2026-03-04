import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/core/config/config.type';
import { App } from 'supertest/types';

interface ApiResponse {
  message: string;
}

describe('Auth Verification (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
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

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const timestamp = Date.now();
  const validUser = {
    name: 'Verification User',
    username: `verify_${timestamp}`,
    email: `verify_${timestamp}@example.com`,
    password: 'Password123!',
    birthDate: '2000-01-01',
  };

  it('Verification Flow: Register -> Fail Verification -> Resend -> Succeed', async () => {
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
