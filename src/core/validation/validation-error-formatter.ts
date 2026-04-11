import { ValidationError } from '@nestjs/common';

type ValidationErrorMeta = Record<string, unknown>;

type FormattedValidationMessage = {
  message: string;
  meta?: ValidationErrorMeta;
};

export type FormattedValidationErrors = Record<
  string,
  FormattedValidationMessage[]
>;

function resolveConstraintMeta(
  error: ValidationError,
  constraintName: string,
): ValidationErrorMeta | undefined {
  const contexts = error.contexts as Record<string, unknown> | undefined;
  const meta = contexts?.[constraintName];
  if (!meta || typeof meta !== 'object') {
    return undefined;
  }
  return meta as ValidationErrorMeta;
}

export function formatValidationErrors(
  errors: ValidationError[],
  parentProperty: string = '',
): FormattedValidationErrors {
  return errors.reduce(
    (acc: FormattedValidationErrors, error: ValidationError) => {
      const property = parentProperty
        ? `${parentProperty}.${error.property}`
        : error.property;

      if (error.constraints) {
        acc[property] = Object.entries(error.constraints).map(
          ([constraintName, message]) => {
            const meta = resolveConstraintMeta(error, constraintName);
            if (!meta) {
              return { message };
            }
            return { message, meta };
          },
        );
      }

      if (error.children && error.children.length > 0) {
        Object.assign(acc, formatValidationErrors(error.children, property));
      }

      return acc;
    },
    {},
  );
}
