import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/core/config/config.type';

describe('HealthController (e2e)', () => {
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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('info');
        expect(res.body).toHaveProperty('details');
      });
  });
});
