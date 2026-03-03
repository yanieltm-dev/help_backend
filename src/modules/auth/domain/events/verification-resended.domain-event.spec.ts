import { VerificationResendedDomainEvent } from './verification-resended.domain-event';

describe('VerificationResendedDomainEvent', () => {
  it('should create an instance with correct properties', () => {
    const email = 'test@example.com';
    const token = '123456';
    const event = new VerificationResendedDomainEvent(email, token);

    expect(event.email).toBe(email);
    expect(event.verificationToken).toBe(token);
    expect(event.occurredAt).toBeInstanceOf(Date);
    expect(VerificationResendedDomainEvent.EVENT_NAME).toBe(
      'verification.resended',
    );
  });
});
