import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { DATABASE_CONNECTION } from '@/core/database/database.module';
import * as argon2 from 'argon2';
import { generateUuidV7 } from '@/shared/utils/uuid';
import { RegisterResponseDto } from './responses/register.response';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRegisteredEvent } from './events/user-registered.event';

import { UserRepository } from './repositories/user.repository';
import { ProfileRepository } from './repositories/profile.repository';
import { VerificationRepository } from './repositories/verification.repository';
import { AccountRepository } from './repositories/account.repository';

import type { DrizzleDatabase } from '@/core/database/connection';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DrizzleDatabase,
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly verificationRepository: VerificationRepository,
    private readonly accountRepository: AccountRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const email = dto.email.toLowerCase();
    const username = dto.username.toLowerCase();

    // 1. Check if email or username already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const existingProfile =
      await this.profileRepository.findByUsername(username);
    if (existingProfile) {
      throw new ConflictException('Username is not available');
    }

    // 2. Hash password
    const passwordHash = await argon2.hash(dto.password);

    // 3. Create user, account and profile in a transaction
    const userId = generateUuidV7();
    const profileId = generateUuidV7();
    const accountId = generateUuidV7();
    const verificationId = generateUuidV7();
    const verificationToken = generateUuidV7();

    try {
      await this.db.transaction(async (tx) => {
        await this.userRepository.create(
          {
            id: userId,
            name: dto.name,
            email: email,
          },
          tx as DrizzleDatabase,
        );

        await this.accountRepository.create(
          {
            id: accountId,
            userId: userId,
            providerId: 'credentials',
            accountId: email,
            password: passwordHash,
            updatedAt: new Date(),
          },
          tx as DrizzleDatabase,
        );

        await this.profileRepository.create(
          {
            id: profileId,
            userId: userId,
            displayName: dto.name,
            username: username,
            birthDate: new Date(dto.birthDate),
          },
          tx as DrizzleDatabase,
        );

        await this.verificationRepository.create(
          {
            id: verificationId,
            identifier: email,
            value: verificationToken,
            type: 'email_verification',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
          tx as DrizzleDatabase,
        );
      });

      // 4. Emit registered event for post-registration side effects (e.g. email)
      this.eventEmitter.emit(
        'user.registered',
        new UserRegisteredEvent(userId, email, verificationToken),
      );

      return {
        message: 'Verification email sent',
        userId,
      };
    } catch (error: unknown) {
      // Logic for 23505 is now handled by global DatabaseExceptionFilter (M-05)
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(
        { err: error, dto: { ...dto, password: '***' } },
        'User registration failed',
      );
      throw new InternalServerErrorException('Error creating user');
    }
  }
}
