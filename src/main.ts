import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from './core/config/config.type';
import { Logger } from 'pino-nestjs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService<AllConfigType>);

  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
  );

  app.useStaticAssets(join(process.cwd(), 'assets'), { prefix: '/assets' });

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

  const options = new DocumentBuilder()
    .setTitle('Help API')
    .setDescription('The Help API description')
    .setVersion('1.0')
    // .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Help API Documentation',
    jsonDocumentUrl: 'swagger/json',
  });

  const port = configService.getOrThrow('app.port', { infer: true });
  await app.listen(port);
}
void bootstrap();
