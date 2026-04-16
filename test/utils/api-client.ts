import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Creates a supertest wrapper with the api/v1 prefix automatically applied.
 */
export function createApiClient(app: INestApplication) {
  const server = app.getHttpServer() as App;
  const prefix = '/api/v1';

  return {
    get: (path: string) => request(server).get(`${prefix}${path}`),
    post: (path: string) => request(server).post(`${prefix}${path}`),
    patch: (path: string) => request(server).patch(`${prefix}${path}`),
    delete: (path: string) => request(server).delete(`${prefix}${path}`),
    put: (path: string) => request(server).put(`${prefix}${path}`),
  };
}

/**
 * Helper to extract the set-cookie header as an array of strings.
 */
export function extractCookies(res: {
  headers: Record<string, unknown>;
}): string[] {
  const header = res.headers['set-cookie'];
  if (!header) return [];
  if (Array.isArray(header)) return header as string[];
  if (typeof header === 'string') return [header];
  return [];
}
