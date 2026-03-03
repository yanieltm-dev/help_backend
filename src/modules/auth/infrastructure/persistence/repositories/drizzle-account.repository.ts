import { Inject, Injectable } from '@nestjs/common';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as schema from '@/core/database/schema';
import { eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '@/core/database/connection';
import { Account } from '@/modules/auth/domain/entities/account.entity';
import { AccountRepository } from '@/modules/auth/domain/ports/account.repository.port';
import { Password } from '@/modules/auth/domain/value-objects/password.vo';

@Injectable()
export class DrizzleAccountRepository implements AccountRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
  ) {}

  async findByUserId(userId: string): Promise<Account | null> {
    const row = await this.db.query.account.findFirst({
      where: eq(schema.account.userId, userId),
    });
    if (!row) return null;
    return new Account(
      row.id,
      row.userId,
      row.providerId,
      row.accountId,
      row.password ? Password.createFromHash(row.password) : undefined,
      row.failedLoginAttempts,
      row.lockedUntil || undefined,
      row.createdAt,
    );
  }

  async save(account: Account, tx?: DrizzleDatabase): Promise<void> {
    const db = tx || this.db;
    await db
      .insert(schema.account)
      .values({
        id: account.id,
        userId: account.userId,
        providerId: account.providerId,
        accountId: account.providerAccountId,
        password: account.password?.value,
        failedLoginAttempts: account.failedLoginAttempts,
        lockedUntil: account.lockedUntil,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.account.id,
        set: {
          password: account.password?.value,
          failedLoginAttempts: account.failedLoginAttempts,
          lockedUntil: account.lockedUntil,
          updatedAt: new Date(),
        },
      });
  }
}
