import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidOtpError extends DomainError {
  constructor() {
    super('INVALID_OTP', 'Invalid verification code');
  }
}

export class ExpiredOtpError extends DomainError {
  constructor() {
    super('EXPIRED_OTP', 'Verification code has expired');
  }
}

export class MaxAttemptsExceededError extends DomainError {
  constructor() {
    super(
      'MAX_OTP_ATTEMPTS_EXCEEDED',
      'Maximum verification attempts exceeded. Please request a new code.',
    );
  }
}
