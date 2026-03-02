import { Inject, Injectable } from '@nestjs/common';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import {
  USER_REPOSITORY,
  ACCOUNT_REPOSITORY,
  PROFILE_REPOSITORY,
  VERIFICATION_REPOSITORY,
  PASSWORD_HASHER,
  EVENT_BUS,
} from '../../auth.tokens';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { User } from '../../domain/entities/user.entity';
import { Account } from '../../domain/entities/account.entity';
import { Profile } from '../../domain/entities/profile.entity';
import { VerificationToken } from '../../domain/entities/verification-token.entity';
import { Password } from '../../domain/value-objects/password.vo';
import { generateUuidV7 } from '@/shared/utils/uuid';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import type { DrizzleDatabase } from '@/core/database/connection';
import { UserRegisteredDomainEvent } from '../../domain/events/user-registered.domain-event';

export interface RegisterUserCommand {
  email: string;
  username: string;
  password: string;
  name: string;
  birthDate: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepository,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepo: ProfileRepository,
    @Inject(VERIFICATION_REPOSITORY)
    private readonly verificationRepo: VerificationRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDatabase,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { email, username, password, name, birthDate } = command;

    // 1. Business Validation
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) throw new UserAlreadyExistsError('email');

    const existingProfile = await this.profileRepo.findByUsername(username);
    if (existingProfile) throw new UserAlreadyExistsError('username');

    // 2. Prepare Data
    const hashedPassword = await this.hasher.hash(password);
    const userId = generateUuidV7();
    const verificationTokenVal = generateUuidV7();

    const user = User.create(userId, email, name);
    const account = Account.createCredentials(
      generateUuidV7(),
      userId,
      email,
      Password.createFromHash(hashedPassword),
    );
    const profile = Profile.create(
      generateUuidV7(),
      userId,
      username,
      name,
      new Date(birthDate),
    );
    const verification = VerificationToken.create(
      generateUuidV7(),
      email,
      verificationTokenVal,
      'email_verification',
    );

    // 3. Execution (Atomic Transaction)
    await this.db.transaction(async (tx) => {
      await this.userRepo.save(user, tx as DrizzleDatabase);
      await this.accountRepo.save(account, tx);
      await this.profileRepo.save(profile, tx);
      await this.verificationRepo.save(verification, tx);
    });

    // 4. Events
    this.eventBus.publish(
      new UserRegisteredDomainEvent(userId, email, verificationTokenVal),
    );

    return { userId };
  }
}
