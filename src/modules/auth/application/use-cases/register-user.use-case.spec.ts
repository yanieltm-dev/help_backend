import type { IEventBus } from '@/shared/domain/ports/event-bus.port';
import { parseDuration } from '@/shared/utils/parse-duration';
import { UserRegisteredDomainEvent } from '../../domain/events/user-registered.domain-event';
import { RegisterUserUseCase } from './register-user.use-case';
import { createRegisterUserUseCaseSut } from './test-utils/sut/create-register-user-use-case-sut';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    const sut = createRegisterUserUseCaseSut();
    useCase = sut.useCase;
    eventBus = sut.eventBus;
  });

  it('publishes UserRegisteredDomainEvent with name and otpExpiresInMs', async () => {
    const command = {
      email: 'user@example.com',
      username: 'user123',
      password: 'Password123!',
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
    expect(event.otpExpiresInMs).toBe(parseDuration('10m'));
    expect(event.verificationToken).toMatch(/^\d{6}$/);
  });
});
