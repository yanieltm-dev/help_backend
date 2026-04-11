import { AllConfigType } from '@/core/config/config.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@Injectable()
@ValidatorConstraint({ name: 'minAgeRegistration', async: false })
export class MinAgeRegistrationConstraint implements ValidatorConstraintInterface {
  constructor(private readonly configService: ConfigService<AllConfigType>) {}

  validate(birthDate: string) {
    if (!birthDate) return false;
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) return false;

    const minAge = this.configService.getOrThrow('auth.minAgeRegister', {
      infer: true,
    });

    const age = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
    );
    return age >= minAge;
  }

  defaultMessage() {
    const minAge = this.configService.getOrThrow('auth.minAgeRegister', {
      infer: true,
    });
    return `You must be at least ${minAge} years old to register`;
  }
}

function resolveMinAgeFromEnv(): number {
  const rawMinAge = process.env.AUTH_MIN_AGE_REGISTER;
  const parsedMinAge = Number.parseInt(rawMinAge ?? '13', 10);
  return Number.isNaN(parsedMinAge) ? 13 : parsedMinAge;
}

export function MinAgeRegistration(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    const minAge = resolveMinAgeFromEnv();
    const context =
      (validationOptions?.context as Record<string, unknown>) ?? {};

    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: {
        ...validationOptions,
        context: {
          ...context,
          minAge,
        },
      },
      constraints: [],
      validator: MinAgeRegistrationConstraint,
    });
  };
}
