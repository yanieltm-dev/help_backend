import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { Logger } from 'pino-nestjs';
import { AppModule } from './app.module';
import { AllConfigType } from './core/config/config.type';
import { formatValidationErrors } from './core/validation/validation-error-formatter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService<AllConfigType>);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
  );

  app.enableCors({
    origin: configService.getOrThrow('app.allowedOrigins', { infer: true }),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useStaticAssets(join(process.cwd(), 'assets'), { prefix: '/assets' });

  const mediaConfig = configService.get('media', { infer: true });
  if (mediaConfig?.provider === 'local') {
    app.useStaticAssets(join(process.cwd(), mediaConfig.localPath), {
      prefix: '/uploads',
    });
  }

  app.use(helmet());

  app.use(
    cookieParser(
      configService.getOrThrow('auth.cookieSecret', { infer: true }),
    ),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
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
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('Help API')
    .setDescription('The Help API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Help API Documentation',
    jsonDocumentUrl: 'swagger/json',
  });

  const port = configService.getOrThrow('app.port', { infer: true });
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
