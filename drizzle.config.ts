import { Config } from 'drizzle-kit';

export default {
  schema: './src/core/database/schema/index.ts',
  out: './src/core/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
