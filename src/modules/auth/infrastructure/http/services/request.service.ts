import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class RequestService {
  getIp(req: Request): string | undefined {
    return req.ip ?? req.socket.remoteAddress;
  }

  getUserAgent(req: Request): string | undefined {
    const header = req.headers['user-agent'];
    return typeof header === 'string' ? header : undefined;
  }
}
