import { Pool } from 'pg';
import type { TestingModuleBuilder } from '@nestjs/testing';
import { MAIL_SERVICE, MAIL_TRANSPORT } from '@/shared/mail/mail.interface';

export async function ensureDbAvailable(): Promise<{ dbAvailable: boolean }> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return { dbAvailable: false };
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 1000,
  });

  try {
    await pool.query('select 1');
    return { dbAvailable: true };
  } catch {
    return { dbAvailable: false };
  } finally {
    await pool.end();
  }
}

export function stubMailProviders(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder
    .overrideProvider(MAIL_TRANSPORT)
    .useValue({
      send: () => Promise.resolve({ providerMessageId: 'test' }),
    })
    .overrideProvider(MAIL_SERVICE)
    .useValue({
      sendTransactionalEmail: () =>
        Promise.resolve({ providerMessageId: 'test' }),
      sendVerificationEmail: () => Promise.resolve(undefined),
      sendPasswordResetEmail: () => Promise.resolve(undefined),
    });
}
