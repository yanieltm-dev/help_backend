import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import { SharedModule } from '@/shared/shared.module';
import { ID_GENERATOR, UNIT_OF_WORK } from '@/shared/shared.tokens';
import { Module } from '@nestjs/common';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import type { ProfileRepository } from './domain/ports/profile.repository.port';
import type { UserRepository } from './domain/ports/user.repository.port';
import { UsersController } from './infrastructure/http/controllers/users.controller';
import { registerUsersDomainErrors } from './infrastructure/http/errors/users-error-registration';
import { DrizzleProfileRepository } from './infrastructure/persistence/repositories/drizzle-profile.repository';
import { DrizzleUserRepository } from './infrastructure/persistence/repositories/drizzle-user.repository';
import { PROFILE_REPOSITORY, USER_REPOSITORY } from './users.tokens';

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [
    {
      provide: GetMeUseCase,
      inject: [USER_REPOSITORY, PROFILE_REPOSITORY],
      useFactory: (
        userRepo: UserRepository,
        profileRepo: ProfileRepository,
      ) => {
        return new GetMeUseCase(userRepo, profileRepo);
      },
    },
    {
      provide: UpdateProfileUseCase,
      inject: [USER_REPOSITORY, PROFILE_REPOSITORY, UNIT_OF_WORK, ID_GENERATOR],
      useFactory: (
        userRepo: UserRepository,
        profileRepo: ProfileRepository,
        uow: IUnitOfWork,
        idGenerator: IIdGenerator,
      ) => {
        return new UpdateProfileUseCase(
          userRepo,
          profileRepo,
          uow,
          idGenerator,
        );
      },
    },
    {
      provide: USER_REPOSITORY,
      useClass: DrizzleUserRepository,
    },
    {
      provide: PROFILE_REPOSITORY,
      useClass: DrizzleProfileRepository,
    },
  ],
  exports: [
    GetMeUseCase,
    UpdateProfileUseCase,
    USER_REPOSITORY,
    PROFILE_REPOSITORY,
  ],
})
export class UsersModule {
  constructor() {
    registerUsersDomainErrors();
  }
}
