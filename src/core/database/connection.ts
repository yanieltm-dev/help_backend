import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type DrizzleDatabase = NodePgDatabase<typeof schema>;

export function createDrizzleDatabaseFromPool(pool: Pool): DrizzleDatabase {
  return drizzle(pool, { schema });
}

export function createDrizzleDatabase(databaseUrl: string): {
  db: DrizzleDatabase;
  pool: Pool;
} {
  const pool = new Pool({ connectionString: databaseUrl });
  const db: DrizzleDatabase = createDrizzleDatabaseFromPool(pool);

  return { db, pool };
}
