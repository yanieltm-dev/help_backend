export type RegisterUserUseCaseConfig = {
  otpExpiresInMs: number;
};
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { Account } from '../../domain/entities/account.entity';
import { Profile } from '../../domain/entities/profile.entity';
import { User } from '../../domain/entities/user.entity';
import {
  VerificationToken,
  VerificationTokenType,
} from '../../domain/entities/verification-token.entity';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error';
import { UserRegisteredDomainEvent } from '../../domain/events/user-registered.domain-event';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import { Otp } from '../../domain/value-objects/otp.vo';
import { Password } from '../../domain/value-objects/password.vo';
import type { PasswordHasher } from '../ports/password-hasher.port';

export interface RegisterUserCommand {
  email: string;
  username: string;
  password: string;
  displayName: string;
  birthDate: string;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly accountRepo: AccountRepository,
    private readonly profileRepo: ProfileRepository,
    private readonly verificationRepo: VerificationRepository,
    private readonly hasher: PasswordHasher,
    private readonly uow: IUnitOfWork,
    private readonly idGenerator: IIdGenerator,
    private readonly eventBus: IEventBus,
    private readonly config: RegisterUserUseCaseConfig,
  ) {}

  async execute(command: RegisterUserCommand) {
    const { email, username, password, displayName, birthDate } = command;

    // Business Validation
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) throw new UserAlreadyExistsError('email');

    const existingProfile = await this.profileRepo.findByUsername(username);
    if (existingProfile) throw new UserAlreadyExistsError('username');

    // Prepare Data
    Password.createRaw(password);
    const hashedPassword = await this.hasher.hash(password);
    const userId = this.idGenerator.generate();
    const otp = Otp.generate().value;
    const hashedOtp = await this.hasher.hash(otp);

    const user = User.create(userId, email);
    const account = Account.createCredentials(
      this.idGenerator.generate(),
      userId,
      email,
      Password.createFromHash(hashedPassword),
    );
    const profile = Profile.create(
      this.idGenerator.generate(),
      userId,
      username,
      displayName,
      null,
      new Date(birthDate),
    );
    const verification = VerificationToken.create(
      this.idGenerator.generate(),
      email,
      hashedOtp,
      VerificationTokenType.EMAIL_VERIFICATION,
      this.config.otpExpiresInMs,
    );

    // Execution (Atomic Transaction)
    await this.uow.run(async (tx) => {
      await this.verificationRepo.invalidateAllForIdentifier(
        email,
        VerificationTokenType.EMAIL_VERIFICATION,
      );
      await this.userRepo.save(user, tx);
      await this.accountRepo.save(account, tx);
      await this.profileRepo.save(profile, tx);
      await this.verificationRepo.save(verification, tx);
    });

    this.eventBus.publish(
      new UserRegisteredDomainEvent(
        userId,
        email,
        otp,
        displayName,
        this.config.otpExpiresInMs,
      ),
    );

    return { userId };
  }
}
