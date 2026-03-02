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

describe('AuthController (e2e)', () => {
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
    await app.close();
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
    it('Scenario 1: Successful registration', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(validUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Verification email sent');
          expect(res.body).toHaveProperty('userId');
        });
    });

    it('Scenario 2: Email already registered', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          username: `other_${timestamp}`, // Different username, same email
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe('Email already registered');
        });
    });

    it('Scenario 3: Username already registered', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          email: `other_${timestamp}@example.com`, // Different email, same username
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe('Username is not available');
        });
    });

    it('Scenario 4: User too young (under 13)', () => {
      const youngUser = {
        ...validUser,
        username: `young_${timestamp}`,
        email: `young_${timestamp}@example.com`,
        birthDate: new Date().toISOString().split('T')[0], // Born today
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(youngUser)
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors.birthDate).toContain(
            'You must be at least 13 years old to register',
          );
        });
    });

    it('Scenario 5: Invalid data (invalid email)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          email: 'not-an-email',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors).toHaveProperty('email');
        });
    });

    it('Scenario 5: Invalid data (weak password)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          ...validUser,
          password: '123',
        })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors).toHaveProperty('password');
        });
    });
  });
});
