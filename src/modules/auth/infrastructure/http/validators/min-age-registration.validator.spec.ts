import { ConfigService } from '@nestjs/config';
import { MinAgeRegistrationConstraint } from './min-age-registration.validator';
import { AllConfigType } from '@/core/config/config.type';

describe('MinAgeRegistrationConstraint', () => {
  let validator: MinAgeRegistrationConstraint;
  let configService: jest.Mocked<ConfigService<AllConfigType>>;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn(),
    } as unknown as jest.Mocked<ConfigService<AllConfigType>>;
    validator = new MinAgeRegistrationConstraint(configService);
  });

  it('should validate correctly when age is above the minimum', () => {
    configService.getOrThrow.mockReturnValue(18);
    const birthDate = '2000-01-01'; // Obviously above 18

    const result = validator.validate(birthDate);

    expect(result).toBe(true);

    expect(configService.getOrThrow).toHaveBeenCalledWith(
      'auth.minAgeRegister',
      { infer: true },
    );
  });

  it('should invalidate when age is below the minimum', () => {
    configService.getOrThrow.mockReturnValue(18);
    // Calculate a date that is 17 years ago
    const seventeenYearsAgo = new Date();
    seventeenYearsAgo.setFullYear(seventeenYearsAgo.getFullYear() - 17);
    const birthDate = seventeenYearsAgo.toISOString().split('T')[0];

    const result = validator.validate(birthDate);

    expect(result).toBe(false);
  });

  it('should use dynamic age in default message', () => {
    configService.getOrThrow.mockReturnValue(21);

    const message = validator.defaultMessage();

    expect(message).toBe('You must be at least 21 years old to register');
  });

  it('should return false for invalid dates', () => {
    expect(validator.validate('invalid-date')).toBe(false);
    expect(validator.validate('')).toBe(false);
  });
});
