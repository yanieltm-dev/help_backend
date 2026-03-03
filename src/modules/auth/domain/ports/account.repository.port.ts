import { Account } from '../entities/account.entity';

export interface AccountRepository {
  findByUserId(userId: string): Promise<Account | null>;
  save(account: Account, tx?: any): Promise<void>;
}
