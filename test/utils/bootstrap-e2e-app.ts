import cookieParser from 'cookie-parser';
import {
  HttpStatus,
  INestApplication,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AppModule } from '@/app.module';
import type { AllConfigType } from '@/core/config/config.type';

import { ensureDbAvailable, stubMailProviders } from './e2e-setup';

type BootstrapE2eAppValidationMode = 'default' | 'production';

type BootstrapE2eAppOptions = Readonly<{
  validationMode: BootstrapE2eAppValidationMode;
  useCookieParser: boolean;
}>;

type BootstrapE2eAppResult = Readonly<{
  app: INestApplication;
  dbAvailable: boolean;
}>;

function createProductionValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    exceptionFactory: (errors: ValidationError[]) => {
      const formatErrors = (
        inputErrors: ValidationError[],
        parentProperty: string = '',
      ): Record<string, string[]> => {
        return inputErrors.reduce(
          (acc: Record<string, string[]>, error: ValidationError) => {
            const property: string = parentProperty
              ? `${parentProperty}.${error.property}`
              : error.property;
            if (error.constraints) {
              acc[property] = Object.values(error.constraints);
            }
            if (error.children && error.children.length > 0) {
              Object.assign(acc, formatErrors(error.children, property));
            }
            return acc;
          },
          {},
        );
      };

      return new UnprocessableEntityException({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Validation failed',
        errors: formatErrors(errors),
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
  const dbCheck = await ensureDbAvailable();
  const moduleFixture: TestingModule = await stubMailProviders(
    Test.createTestingModule({
      imports: [AppModule],
    }),
  ).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
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
    dbAvailable: dbCheck.dbAvailable,
  };
}
