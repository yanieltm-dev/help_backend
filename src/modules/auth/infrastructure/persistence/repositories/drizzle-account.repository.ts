import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import type { DrizzleDatabase } from '@/core/database/connection';
import { Account } from '@/modules/auth/domain/entities/account.entity';
import { AccountRepository } from '@/modules/auth/domain/ports/account.repository.port';

@Injectable()
export class DrizzleAccountRepository implements AccountRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async save(account: Account, tx?: DrizzleDatabase): Promise<void> {
    const db = tx || this.db;
    await db.insert(schema.account).values({
      id: account.id,
      userId: account.userId,
      providerId: account.providerId,
      accountId: account.providerAccountId,
      password: account.password?.value,
      updatedAt: new Date(),
    });
  }
}
