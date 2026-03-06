import { RequestPasswordResetUseCase } from './request-password-reset.use-case';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import type { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { User } from '../../domain/entities/user.entity';
import { PasswordResetRequestedDomainEvent } from '../../domain/events/password-reset-requested.domain-event';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let eventBus: jest.Mocked<IEventBus>;
  let idGenerator: jest.Mocked<IIdGenerator>;

  beforeEach(() => {
    userRepo = {
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    verificationRepo = {
      countRecentForIdentifierAndTypeSince: jest.fn(),
      invalidateAllForIdentifier: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<VerificationRepository>;
    hasher = {
      hash: jest.fn().mockResolvedValue('hashed_otp'),
    } as unknown as jest.Mocked<PasswordHasher>;
    eventBus = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<IEventBus>;
    idGenerator = {
      generate: jest.fn().mockReturnValue('verification-id'),
    } as unknown as jest.Mocked<IIdGenerator>;

    useCase = new RequestPasswordResetUseCase(
      userRepo,
      verificationRepo,
      hasher,
      eventBus,
      idGenerator,
      { otpExpiresInMs: 600000, maxRequests: 5, windowMs: 900000 },
    );
  });

  it('publishes PasswordResetRequestedDomainEvent when user exists', async () => {
    const email = 'user@example.com';
    const user = User.create('user-id', email, 'Alice', true);
    userRepo.findByEmail.mockResolvedValue(user);
    verificationRepo.countRecentForIdentifierAndTypeSince.mockResolvedValue(0);

    await useCase.execute({ email });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.invalidateAllForIdentifier).toHaveBeenCalledWith(
      email,
      'password_reset',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.save).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(PasswordResetRequestedDomainEvent),
    );

    const event = eventBus.publish.mock
      .calls[0][0] as PasswordResetRequestedDomainEvent;
    expect(event.email).toBe(email);
    expect(event.name).toBe('Alice');
    expect(event.otp).toMatch(/^\d{6}$/);
    expect(event.otpExpiresInMs).toBe(600000);
  });

  it('does nothing (but does not throw) when user does not exist', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'unknown@example.com' }),
    ).resolves.toBeUndefined();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('does nothing (but does not throw) when request rate limit is exceeded', async () => {
    const email = 'user@example.com';
    const user = User.create('user-id', email, 'Alice', true);
    userRepo.findByEmail.mockResolvedValue(user);
    verificationRepo.countRecentForIdentifierAndTypeSince.mockResolvedValue(5);

    await expect(useCase.execute({ email })).resolves.toBeUndefined();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.invalidateAllForIdentifier).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.save).not.toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
