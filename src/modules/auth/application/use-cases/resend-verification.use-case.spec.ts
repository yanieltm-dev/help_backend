import { ResendVerificationUseCase } from './resend-verification.use-case';

import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { parseDuration } from '@/shared/utils/parse-duration';
import { Profile } from '@/modules/users/domain/entities/profile.entity';
import { User } from '@/modules/users/domain/entities/user.entity';
import { VerificationTokenType } from '../../domain/entities/verification-token.entity';
import { EmailAlreadyVerifiedError } from '../../domain/errors/email-already-verified.error';
import { UserNotFoundError } from '@/modules/users/domain/errors/user-not-found.error';
import { VerificationResendedDomainEvent } from '../../domain/events/verification-resended.domain-event';
import type { ProfileRepository } from '@/modules/users/domain/ports/profile.repository.port';
import type { UserRepository } from '@/modules/users/domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import { createResendVerificationUseCaseSut } from './test-utils/sut/create-resend-verification-use-case-sut';

jest.mock('@/shared/utils/uuid', () => ({
  generateUuidV7: jest.fn(() => 'mocked-uuid'),
}));

describe('ResendVerificationUseCase', () => {
  let useCase: ResendVerificationUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let profileRepo: jest.Mocked<ProfileRepository>;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(function (this: void) {
    const sut = createResendVerificationUseCaseSut();
    ({ useCase, userRepo, profileRepo, verificationRepo, eventBus } = sut);
    verificationRepo.countRecentForIdentifierAndTypeSince.mockResolvedValue(0);
  });

  it('should publish VerificationResendedDomainEvent when successful', async () => {
    const emailStr = 'test@example.com';
    const user = User.create('user-id', emailStr, false);
    userRepo.findByEmail.mockResolvedValue(user);
    profileRepo.findByUserId.mockResolvedValue(
      Profile.create(
        'profile-id',
        user.id,
        'testuser',
        'Test User',
        null,
        new Date('1990-01-01'),
      ),
    );

    await useCase.execute({ email: emailStr });

    expect(verificationRepo.invalidateAllForIdentifier).toHaveBeenCalledWith(
      emailStr,
      VerificationTokenType.EMAIL_VERIFICATION,
    );

    expect(verificationRepo.save).toHaveBeenCalled();

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(VerificationResendedDomainEvent),
    );

    const event = eventBus.publish.mock
      .calls[0][0] as VerificationResendedDomainEvent;
    expect(event.email).toBe(emailStr);
    expect(event.verificationToken).toMatch(/^\d{6}$/);
    expect(event.name).toBe('Test User');
    expect(event.otpExpiresInMs).toBe(parseDuration('1h'));
  });

  it('should throw BadRequestException if user not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'unknown@example.com' }),
    ).rejects.toThrow(UserNotFoundError);

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException if email already verified', async () => {
    const emailStr = 'test@example.com';
    const user = User.create('user-id', emailStr, true);
    userRepo.findByEmail.mockResolvedValue(user);

    await expect(useCase.execute({ email: emailStr })).rejects.toThrow(
      EmailAlreadyVerifiedError,
    );

    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should not resend verification email when rate limit is exceeded', async () => {
    const emailStr = 'test@example.com';
    const user = User.create('user-id', emailStr, false);
    userRepo.findByEmail.mockResolvedValue(user);
    verificationRepo.countRecentForIdentifierAndTypeSince.mockResolvedValue(3);

    await useCase.execute({ email: emailStr });

    const firstCall =
      verificationRepo.countRecentForIdentifierAndTypeSince.mock.calls[0];
    expect(firstCall).toBeDefined();
    const [actualIdentifier, actualType, actualSince] = firstCall;
    expect(actualIdentifier).toBe(emailStr);
    expect(actualType).toBe(VerificationTokenType.EMAIL_VERIFICATION);
    expect(actualSince).toBeInstanceOf(Date);

    expect(verificationRepo.invalidateAllForIdentifier).not.toHaveBeenCalled();

    expect(verificationRepo.save).not.toHaveBeenCalled();

    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
