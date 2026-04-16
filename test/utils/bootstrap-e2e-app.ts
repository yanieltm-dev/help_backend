import {
  HttpStatus,
  INestApplication,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';

import { AppModule } from '@/app.module';
import type { AllConfigType } from '@/core/config/config.type';
import { formatValidationErrors } from '@/core/validation/validation-error-formatter';

import { ensureDbAvailable, stubMailProviders } from './e2e-setup';

type BootstrapE2eAppValidationMode = 'default' | 'production';

type BootstrapE2eAppOptions = Readonly<{
  validationMode: BootstrapE2eAppValidationMode;
  useCookieParser: boolean;
}>;

type BootstrapE2eAppResult = Readonly<{
  app: INestApplication;
  pool: Pool;
}>;

function createProductionValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    exceptionFactory: (errors: ValidationError[]) => {
      return new UnprocessableEntityException({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Validation failed',
        errors: formatValidationErrors(errors),
      });
    },
  });
}

function createDefaultValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
  });
}

function resolveValidationPipe(
  validationMode: BootstrapE2eAppValidationMode,
): ValidationPipe {
  if (validationMode === 'production') {
    return createProductionValidationPipe();
  }
  return createDefaultValidationPipe();
}

export async function bootstrapE2eApp(
  options: Partial<BootstrapE2eAppOptions> = {},
): Promise<BootstrapE2eAppResult> {
  const resolvedOptions: BootstrapE2eAppOptions = {
    validationMode: options.validationMode ?? 'default',
    useCookieParser: options.useCookieParser ?? false,
  };

  // 1. Ensure DB is up and get a pool
  const pool = await ensureDbAvailable();

  // 2. Create app
  const moduleFixture: TestingModule = await stubMailProviders(
    Test.createTestingModule({
      imports: [AppModule],
    }),
  ).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService<AllConfigType>);
  const apiPrefix = configService.getOrThrow('app.apiPrefix', {
    infer: true,
  });

  app.setGlobalPrefix(apiPrefix);

  if (resolvedOptions.useCookieParser) {
    app.use(
      cookieParser(
        configService.getOrThrow('auth.cookieSecret', { infer: true }),
      ),
    );
  }

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(resolveValidationPipe(resolvedOptions.validationMode));

  await app.init();

  return {
    app,
    pool,
  };
}
