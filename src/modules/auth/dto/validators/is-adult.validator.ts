import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAdult', async: false })
export class IsAdultConstraint implements ValidatorConstraintInterface {
  validate(birthDate: string) {
    if (!birthDate) return false;
    const date = new Date(birthDate);
    if (isNaN(date.getTime())) return false;

    const age = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365.25),
    );
    return age >= 13;
  }

  defaultMessage() {
    return 'You must be at least 13 years old to register';
  }
}

export function IsAtLeast13YearsOld(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAdultConstraint,
    });
  };
}
