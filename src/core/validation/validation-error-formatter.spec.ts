import { ValidationError } from '@nestjs/common';
import { formatValidationErrors } from './validation-error-formatter';

describe('formatValidationErrors', () => {
  it('includes constraint metadata when available', () => {
    const errors: ValidationError[] = [
      {
        property: 'birthDate',
        constraints: {
          minAgeRegistration: 'You must be at least 16 years old to register',
        },
        contexts: {
          minAgeRegistration: {
            minAge: 16,
          },
        },
        children: [],
      },
    ];

    const formatted = formatValidationErrors(errors);

    expect(formatted).toEqual({
      birthDate: [
        {
          message: 'You must be at least 16 years old to register',
          meta: {
            minAge: 16,
          },
        },
      ],
    });
  });

  it('keeps message-only format when metadata is absent', () => {
    const errors: ValidationError[] = [
      {
        property: 'email',
        constraints: {
          isEmail: 'email must be an email',
        },
        children: [],
      },
    ];

    const formatted = formatValidationErrors(errors);

    expect(formatted).toEqual({
      email: [
        {
          message: 'email must be an email',
        },
      ],
    });
  });
});
