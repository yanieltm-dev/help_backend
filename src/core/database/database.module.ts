import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDrizzleDatabase } from './connection';
import { AllConfigType } from '../config/config.type';

export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const databaseUrl = configService.getOrThrow('database.url', {
          infer: true,
        });
        const { db } = createDrizzleDatabase(databaseUrl);
        return db;
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
