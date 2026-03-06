import { RegisterUserUseCase } from './register-user.use-case';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { AccountRepository } from '../../domain/ports/account.repository.port';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IUnitOfWork } from '@/shared/domain/ports/unit-of-work.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { UserRegisteredDomainEvent } from '../../domain/events/user-registered.domain-event';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let accountRepo: jest.Mocked<AccountRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let uow: jest.Mocked<IUnitOfWork>;
  let idGenerator: jest.Mocked<IIdGenerator>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    userRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    accountRepo = {
      save: jest.fn(),
    } as unknown as jest.Mocked<AccountRepository>;
    profileRepo = {
      findByUsername: jest.fn().mockResolvedValue(null),
      findByUserId: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ProfileRepository>;
    verificationRepo = {
      countRecentForIdentifierAndTypeSince: jest.fn(),
      invalidateAllForIdentifier: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<VerificationRepository>;
    hasher = {
      hash: jest.fn().mockResolvedValue('hashed'),
    } as unknown as jest.Mocked<PasswordHasher>;
    uow = {
      run: jest.fn(async (fn: (tx: unknown) => Promise<void>) => {
        await fn({} as unknown);
      }),
    } as unknown as jest.Mocked<IUnitOfWork>;
    idGenerator = {
      generate: jest.fn().mockReturnValue('id-1'),
    } as unknown as jest.Mocked<IIdGenerator>;
    eventBus = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<IEventBus>;

    useCase = new RegisterUserUseCase(
      userRepo,
      accountRepo,
      profileRepo,
      verificationRepo,
      hasher,
      uow,
      idGenerator,
      eventBus,
      { otpExpiresInMs: 600000 },
    );
  });

  it('publishes UserRegisteredDomainEvent with name and otpExpiresInMs', async () => {
    const command = {
      email: 'user@example.com',
      username: 'user123',
      password: 'password123!',
      name: 'Alice',
      birthDate: '2000-01-01',
    };

    await useCase.execute(command);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(UserRegisteredDomainEvent),
    );

    const event = eventBus.publish.mock
      .calls[0][0] as UserRegisteredDomainEvent;

    expect(event.email).toBe('user@example.com');
    expect(event.name).toBe('Alice');
    expect(event.otpExpiresInMs).toBe(600000);
    expect(event.verificationToken).toMatch(/^\d{6}$/);
  });
});
