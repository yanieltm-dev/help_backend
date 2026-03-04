import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import type { DrizzleDatabase } from '@/core/database/connection';
import { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';

@Injectable()
export class DrizzleUnitOfWork implements IUnitOfWork {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async run<T>(work: (tx?: DrizzleDatabase) => Promise<T>): Promise<T> {
    return await this.db.transaction(async (tx) => {
      return await work(tx as DrizzleDatabase);
    });
  }
}
