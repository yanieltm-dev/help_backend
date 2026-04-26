/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';
import { AllConfigType } from '../src/core/config/config.type';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'pino-nestjs';
import {
  ValidationPipe,
  HttpStatus,
  UnprocessableEntityException,
  VersioningType,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { formatValidationErrors } from '../src/core/validation/validation-error-formatter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const expressApp = express();
let nestApp: any;

async function bootstrap() {
  if (!nestApp) {
    const adapter = new ExpressAdapter(expressApp);
    nestApp = await NestFactory.create(AppModule, adapter, {
      bufferLogs: true,
    });

    const logger = nestApp.get(Logger);
    nestApp.useLogger(logger);

    const configService = nestApp.get(ConfigService<AllConfigType>);

    useContainer(nestApp.select(AppModule), { fallbackOnErrors: true });

    nestApp.setGlobalPrefix(
      configService.getOrThrow('app.apiPrefix', { infer: true }),
    );

    nestApp.enableCors({
      origin: configService.getOrThrow('app.allowedOrigins', { infer: true }),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Static assets - only serve in non-serverless environments
    const isServerless = process.env.VERCEL === '1';
    if (!isServerless) {
      expressApp.use('/assets', express.static(join(process.cwd(), 'assets')));

      const mediaConfig = configService.get('media', { infer: true });
      if (mediaConfig?.provider === 'local') {
        expressApp.use(
          '/uploads',
          express.static(join(process.cwd(), mediaConfig.localPath)),
        );
      }
    }

    expressApp.use(helmet());

    expressApp.use(
      cookieParser(
        configService.getOrThrow('auth.cookieSecret', { infer: true }),
      ),
    );

    nestApp.enableVersioning({
      type: VersioningType.URI,
    });

    nestApp.useGlobalPipes(
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

    const document = SwaggerModule.createDocument(nestApp, options);
    SwaggerModule.setup('docs', nestApp, document, {
      customSiteTitle: 'Help API Documentation',
      jsonDocumentUrl: 'swagger/json',
    });

    await nestApp.init();
  }
  return nestApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await bootstrap();
  expressApp(req, res);
}
