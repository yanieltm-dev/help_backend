import { INestApplication } from '@nestjs/common';
import { Pool } from 'pg';
import { bootstrapE2eApp } from './bootstrap-e2e-app';

let appInstance: INestApplication | null = null;
let poolInstance: Pool | null = null;

/**
 * Initializes the global test context (app and pool).
 * Since we run tests in series, we can reuse these instances.
 */
export async function initializeTestContext(): Promise<{
  app: INestApplication;
  pool: Pool;
}> {
  if (appInstance && poolInstance) {
    return { app: appInstance, pool: poolInstance };
  }

  const result = await bootstrapE2eApp({
    validationMode: 'production',
    useCookieParser: true,
  });

  appInstance = result.app;
  poolInstance = result.pool;

  return { app: appInstance, pool: poolInstance };
}

/**
 * Returns the active Nest application instance.
 * Must be called after initializeTestContext().
 */
export function getApp(): INestApplication {
  if (!appInstance) {
    throw new Error(
      'Test context not initialized. Call initializeTestContext() first.',
    );
  }
  return appInstance;
}

/**
 * Returns the active Database pool instance.
 * Must be called after initializeTestContext().
 */
export function getPool(): Pool {
  if (!poolInstance) {
    throw new Error(
      'Test context not initialized. Call initializeTestContext() first.',
    );
  }
  return poolInstance;
}

/**
 * Tears down the global test context.
 */
export async function teardownTestContext(): Promise<void> {
  if (appInstance) {
    await appInstance.close();
    appInstance = null;
  }
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
