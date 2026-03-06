import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedRequestUser } from '../../security/jwt.strategy';

export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedRequestUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const userUnknown: unknown = (request as Request & { user?: unknown }).user;
    return userUnknown as AuthenticatedRequestUser;
  },
);
