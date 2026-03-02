import { User } from '../entities/user.entity';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User, tx?: any): Promise<void>;
}
