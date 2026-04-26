import { MAIL_SERVICE, MAIL_TRANSPORT } from '@/shared/mail/mail.interface';
import type { TestingModuleBuilder } from '@nestjs/testing';
import { Pool } from 'pg';

/**
 * Ensures the test database is available.
 * Throws an error if connection fails.
 */
export async function ensureDbAvailable(retries = 5): Promise<Pool> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });

  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      return pool;
    } catch (error) {
      if (i === retries - 1) {
        await pool.end();
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Could not connect to the test database at ${databaseUrl} after ${retries} attempts. Original error: ${message}`,
        );
      }
      // Wait before next retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Unreachable state in ensureDbAvailable');
}

/**
 * Cleans the database by truncating all tables in the public schema.
 * Replaces the static table list with dynamic table discovery.
 */
export async function cleanDatabase(pool: Pool): Promise<void> {
  // Discover all tables in the public schema
  const { rows } = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );

  if (rows.length === 0) {
    return;
  }

  const tables = rows.map((r) => `"${r.tablename}"`).join(', ');
  const truncateQuery = `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`;
  await pool.query(truncateQuery);
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
