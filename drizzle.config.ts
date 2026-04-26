import { Config } from 'drizzle-kit';

export default {
  schema: './src/core/database/schema/index.ts',
  out: './src/core/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`,
  },
} satisfies Config;
