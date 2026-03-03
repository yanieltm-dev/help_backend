import { Test, TestingModule } from '@nestjs/testing';
import { ResendVerificationUseCase } from './resend-verification.use-case';
import {
  USER_REPOSITORY,
  VERIFICATION_REPOSITORY,
  PASSWORD_HASHER,
  EVENT_BUS,
} from '../../auth.tokens';
import { VerificationResendedDomainEvent } from '../../domain/events/verification-resended.domain-event';
import { BadRequestException } from '@nestjs/common';
import type { UserRepository } from '../../domain/ports/user.repository.port';
import type { VerificationRepository } from '../../domain/ports/verification.repository.port';
import type { PasswordHasher } from '../../domain/ports/password-hasher.port';
import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { User } from '../../domain/entities/user.entity';

jest.mock('@/shared/utils/uuid', () => ({
  generateUuidV7: jest.fn(() => 'mocked-uuid'),
}));

describe('ResendVerificationUseCase', () => {
  let useCase: ResendVerificationUseCase;
  let userRepo: jest.Mocked<UserRepository>;
  let verificationRepo: jest.Mocked<VerificationRepository>;
  let hasher: jest.Mocked<PasswordHasher>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(async () => {
    userRepo = {
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;
    verificationRepo = {
      invalidateAllForIdentifier: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<VerificationRepository>;
    hasher = {
      hash: jest.fn().mockResolvedValue('hashed_otp'),
    } as unknown as jest.Mocked<PasswordHasher>;
    eventBus = {
      publish: jest.fn(),
    } as unknown as jest.Mocked<IEventBus>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendVerificationUseCase,
        { provide: USER_REPOSITORY, useValue: userRepo },
        { provide: VERIFICATION_REPOSITORY, useValue: verificationRepo },
        { provide: PASSWORD_HASHER, useValue: hasher },
        { provide: EVENT_BUS, useValue: eventBus },
      ],
    }).compile();

    useCase = module.get<ResendVerificationUseCase>(ResendVerificationUseCase);
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
  });

  it('should throw BadRequestException if user not found', async () => {
    userRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'unknown@example.com' }),
    ).rejects.toThrow(BadRequestException);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException if email already verified', async () => {
    const emailStr = 'test@example.com';
    const user = User.create('user-id', emailStr, 'Test User', true);
    userRepo.findByEmail.mockResolvedValue(user);

    await expect(useCase.execute({ email: emailStr })).rejects.toThrow(
      BadRequestException,
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(eventBus.publish).not.toHaveBeenCalled();
  });
});
