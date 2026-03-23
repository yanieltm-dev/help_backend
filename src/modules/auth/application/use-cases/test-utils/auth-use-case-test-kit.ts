import type { Authenticator } from '@/modules/auth/application/ports/authenticator.port';
import type { PasswordHasher } from '@/modules/auth/application/ports/password-hasher.port';
import type { AccountRepository } from '@/modules/auth/domain/ports/account.repository.port';
import type { ProfileRepository } from '@/modules/auth/domain/ports/profile.repository.port';
import type { SessionRepository } from '@/modules/auth/domain/ports/session.repository.port';
import type { UserRepository } from '@/modules/auth/domain/ports/user.repository.port';
import type { VerificationRepository } from '@/modules/auth/domain/ports/verification.repository.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';

type UnitOfWorkWork<T> = (tx: unknown) => Promise<T>;

type AuthUseCaseTestKitType = Readonly<{
  createUserRepositoryMock: () => jest.Mocked<UserRepository>;
  createAccountRepositoryMock: () => jest.Mocked<AccountRepository>;
  createProfileRepositoryMock: () => jest.Mocked<ProfileRepository>;
  createVerificationRepositoryMock: () => jest.Mocked<VerificationRepository>;
  createSessionRepositoryMock: () => jest.Mocked<SessionRepository>;
  createPasswordHasherMock: () => jest.Mocked<PasswordHasher>;
  createAuthenticatorMock: () => jest.Mocked<Authenticator>;
  createEventBusMock: () => jest.Mocked<IEventBus>;
  createIdGeneratorMock: () => jest.Mocked<IIdGenerator>;
  createUnitOfWorkMock: () => jest.Mocked<IUnitOfWork>;
}>;

export const AuthUseCaseTestKit: AuthUseCaseTestKitType = {
  createUserRepositoryMock: (): jest.Mocked<UserRepository> =>
    ({
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    }) as unknown as jest.Mocked<UserRepository>,
  createAccountRepositoryMock: (): jest.Mocked<AccountRepository> =>
    ({
      findByUserId: jest.fn(),
      save: jest.fn(),
    }) as unknown as jest.Mocked<AccountRepository>,
  createProfileRepositoryMock: (): jest.Mocked<ProfileRepository> =>
    ({
      findByUsername: jest.fn(),
      findByUserId: jest.fn(),
      save: jest.fn(),
    }) as unknown as jest.Mocked<ProfileRepository>,
  createVerificationRepositoryMock: (): jest.Mocked<VerificationRepository> =>
    ({
      countRecentForIdentifierAndTypeSince: jest.fn(),
      delete: jest.fn(),
      findByIdAndType: jest.fn(),
      findByIdentifierAndType: jest.fn(),
      invalidateAllForIdentifier: jest.fn(),
      save: jest.fn(),
    }) as unknown as jest.Mocked<VerificationRepository>,
  createSessionRepositoryMock: (): jest.Mocked<SessionRepository> =>
    ({
      deleteByToken: jest.fn(),
      deleteByUserId: jest.fn(),
      deleteByUserIdExceptToken: jest.fn(),
      findByToken: jest.fn(),
      save: jest.fn(),
    }) as unknown as jest.Mocked<SessionRepository>,
  createPasswordHasherMock: (): jest.Mocked<PasswordHasher> =>
    ({
      compare: jest.fn(),
      hash: jest.fn(),
    }) as unknown as jest.Mocked<PasswordHasher>,
  createAuthenticatorMock: (): jest.Mocked<Authenticator> =>
    ({
      generateTokens: jest.fn(),
      verifyToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    }) as unknown as jest.Mocked<Authenticator>,
  createEventBusMock: (): jest.Mocked<IEventBus> =>
    ({
      publish: jest.fn(),
    }) as unknown as jest.Mocked<IEventBus>,
  createIdGeneratorMock: (): jest.Mocked<IIdGenerator> =>
    ({
      generate: jest.fn(),
    }) as unknown as jest.Mocked<IIdGenerator>,
  createUnitOfWorkMock: (): jest.Mocked<IUnitOfWork> =>
    ({
      run: jest.fn(async <T>(work: UnitOfWorkWork<T>): Promise<T> => {
        return await work({} as unknown);
      }),
    }) as unknown as jest.Mocked<IUnitOfWork>,
} as const;
