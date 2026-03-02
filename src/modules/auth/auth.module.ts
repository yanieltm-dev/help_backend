import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UserRepository } from './repositories/user.repository';
import { ProfileRepository } from './repositories/profile.repository';
import { VerificationRepository } from './repositories/verification.repository';
import { AccountRepository } from './repositories/account.repository';
import { UserRegisteredListener } from './listeners/user-registered.listener';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    ProfileRepository,
    VerificationRepository,
    AccountRepository,
    UserRegisteredListener,
  ],
  exports: [AuthService],
})
export class AuthModule {}
