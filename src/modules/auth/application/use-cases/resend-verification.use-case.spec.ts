import { ResendVerificationUseCase } from './resend-verification.use-case';

import { VerificationResendedDomainEvent } from '../../domain/events/verification-resended.domain-event';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { EmailAlreadyVerifiedError } from '../../domain/errors/email-already-verified.error';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { User } from '../../domain/entities/user.entity';
import { createResendVerificationUseCaseSut } from './test-utils/sut/create-resend-verification-use-case-sut';

jest.mock('@/shared/utils/uuid', () => ({
  generateUuidV7: jest.fn(() => 'mocked-uuid'),
}));

describe('ResendVerificationUseCase', () => {
  let useCase: ResendVerificationUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    const sut = createResendVerificationUseCaseSut();
    useCase = sut.useCase;
    userRepo = sut.userRepo;
    verificationRepo = sut.verificationRepo;
    eventBus = sut.eventBus;
  });

  it('should publish VerificationResendedDomainEvent when successful', async () => {
    const emailStr = 'test@example.com';
    const user = User.create('user-id', emailStr, 'Test User', false);
    userRepo.findByEmail.mockResolvedValue(user);

    await useCase.execute({ email: emailStr });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.invalidateAllForIdentifier).toHaveBeenCalledWith(
      emailStr,
      'email_verification',
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(verificationRepo.save).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(VerificationResendedDomainEvent),
    );

    const event = eventBus.publish.mock
      .calls[0][0] as VerificationResendedDomainEvent;
    expect(event.email).toBe(emailStr);
    expect(event.verificationToken).toMatch(/^\d{6}$/);
    expect(event.name).toBe('Test User');
    expect(event.otpExpiresInMs).toBe(3600000);
  });

  it('should throw BadRequestException if user not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'unknown@example.com' }),
    ).rejects.toThrow(UserNotFoundError);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException if email already verified', async () => {
    const emailStr = 'test@example.com';
    const user = User.create('user-id', emailStr, 'Test User', true);
    userRepo.findByEmail.mockResolvedValue(user);

    await expect(useCase.execute({ email: emailStr })).rejects.toThrow(
      EmailAlreadyVerifiedError,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
