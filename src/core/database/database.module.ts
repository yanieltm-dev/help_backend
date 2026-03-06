import { Inject, Module, Global, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createDrizzleDatabaseFromPool,
  type DrizzleDatabase,
} from './connection';
import { AllConfigType } from '../config/config.type';
import { Pool } from 'pg';

export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');
export const DATABASE_POOL = Symbol('DATABASE_POOL');

class DatabaseShutdownHook implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown() {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const databaseUrl = configService.getOrThrow('database.url', {
          infer: true,
        });
        return new Pool({ connectionString: databaseUrl });
      },
    },
    {
      provide: DATABASE_CONNECTION,
      inject: [DATABASE_POOL],
      useFactory: (pool: Pool): DrizzleDatabase => {
        return createDrizzleDatabaseFromPool(pool);
      },
    },
    DatabaseShutdownHook,
  ],
  exports: [DATABASE_CONNECTION, DATABASE_POOL],
})
export class DatabaseModule {}
