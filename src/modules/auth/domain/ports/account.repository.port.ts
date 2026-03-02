import { Account } from '../entities/account.entity';

export interface AccountRepository {
  save(account: Account, tx?: any): Promise<void>;
}
