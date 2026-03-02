import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '@/shared/domain/errors/domain.error';
import { mapDomainError } from './domain-error.mapper';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Check for our custom domain errors
    if (exception instanceof DomainError) {
      const mapping = mapDomainError(exception);
      const status = mapping?.status ?? HttpStatus.BAD_REQUEST;

      return response.status(status).json({
        statusCode: status,
        message: exception.message,
        error: mapping?.error ?? 'Domain Error',
      });
    }

    // Check for PostgreSQL unique violation error code
    if (
      exception instanceof Object &&
      'code' in exception &&
      (exception as { code: unknown }).code === '23505'
    ) {
      const status = HttpStatus.CONFLICT;

      const pgError = exception as {
        code: string;
        detail?: string;
        constraint?: string;
      };

      return response.status(status).json({
        statusCode: status,
        message: pgError.detail ?? 'A record with this value already exists',
        error: 'Conflict',
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseBody = exception.getResponse();

      return response
        .status(status)
        .json(
          typeof responseBody === 'object'
            ? responseBody
            : { statusCode: status, message: responseBody },
        );
    }

    // Default values for non-HttpException, non-database objects
    if (exception instanceof Error) {
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      const message = exception.message;
      return response.status(status).json({
        statusCode: status,
        message: message,
        error: 'Internal Server Error',
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }
}
