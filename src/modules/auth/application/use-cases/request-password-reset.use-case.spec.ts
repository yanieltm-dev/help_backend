import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { parseDuration } from '@/shared/utils/parse-duration';
import { Profile } from '../../domain/entities/profile.entity';
import { User } from '../../domain/entities/user.entity';
import { VerificationTokenType } from '../../domain/entities/verification-token.entity';
import { PasswordResetRequestedDomainEvent } from '../../domain/events/password-reset-requested.domain-event';
import type { ProfileRepository } from '../../domain/ports/profile.repository.port';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import { RequestPasswordResetUseCase } from './request-password-reset.use-case';
import { createRequestPasswordResetUseCaseSut } from './test-utils/sut/create-request-password-reset-use-case-sut';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(function (this: void) {
    const sut = createRequestPasswordResetUseCaseSut();
    ({ useCase, userRepo, profileRepo, verificationRepo, eventBus } = sut);
  });

  it('publishes PasswordResetRequestedDomainEvent when user exists', async () => {
    const email = 'user@example.com';
    const user = User.create('user-id', email, true);
    userRepo.findByEmail.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(
      Profile.create(
        'profile-id',
        user.id,
        'alice',
        'Alice',
        null,
        new Date('1990-01-01'),
      ),
    );
    verificationRepo.countRecentForIdentifierAndTypeSince.mockResolvedValue(0);

    await useCase.execute({ email });

    expect(verificationRepo.invalidateAllForIdentifier).toHaveBeenCalledWith(
      email,
      VerificationTokenType.PASSWORD_RESET,
    );

    expect(verificationRepo.save).toHaveBeenCalled();

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(PasswordResetRequestedDomainEvent),
    );

    const event = eventBus.publish.mock
      .calls[0][0] as PasswordResetRequestedDomainEvent;
    expect(event.email).toBe(email);
    expect(event.name).toBe('Alice');
    expect(event.otp).toMatch(/^\d{6}$/);
    expect(event.otpExpiresInMs).toBe(parseDuration('10m'));
  });

  it('does nothing (but does not throw) when user does not exist', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'unknown@example.com' }),
    ).resolves.toBeUndefined();

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('does nothing (but does not throw) when request rate limit is exceeded', async () => {
    const email = 'user@example.com';
    const user = User.create('user-id', email, true);
    userRepo.findByEmail.mockResolvedValue(user);
    verificationRepo.countRecentForIdentifierAndTypeSince.mockResolvedValue(5);

    await expect(useCase.execute({ email })).resolves.toBeUndefined();

    expect(verificationRepo.invalidateAllForIdentifier).not.toHaveBeenCalled();

    expect(verificationRepo.save).not.toHaveBeenCalled();

    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
