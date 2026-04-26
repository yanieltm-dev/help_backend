import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export type AuthenticatedUser = {
  userId: string;
  email: string;
};

export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const userUnknown: unknown = (request as Request & { user?: unknown }).user;
    return userUnknown as AuthenticatedUser;
  },
);
