import { RequestPasswordResetUseCase } from './request-password-reset.use-case';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { User } from '../../domain/entities/user.entity';
import { PasswordResetRequestedDomainEvent } from '../../domain/events/password-reset-requested.domain-event';
import { createRequestPasswordResetUseCaseSut } from './test-utils/sut/create-request-password-reset-use-case-sut';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    const sut = createRequestPasswordResetUseCaseSut();
    useCase = sut.useCase;
    userRepo = sut.userRepo;
    verificationRepo = sut.verificationRepo;
    eventBus = sut.eventBus;
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
