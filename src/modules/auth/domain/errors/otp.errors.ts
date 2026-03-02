import { DomainError } from '@/shared/domain/errors/domain.error';

export class InvalidOtpError extends DomainError {
  constructor() {
    super('Invalid verification code');
  }
}

export class ExpiredOtpError extends DomainError {
  constructor() {
    super('Verification code has expired');
  }
}

export class MaxAttemptsExceededError extends DomainError {
  constructor() {
    super('Maximum verification attempts exceeded. Please request a new code.');
  }
}
