import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@/core/config/config.type';
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

export function MinAgeRegistration(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: MinAgeRegistrationConstraint,
    });
  };
}
