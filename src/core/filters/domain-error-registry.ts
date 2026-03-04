import { HttpStatus } from '@nestjs/common';

export interface ErrorMapping {
  status: HttpStatus;
  error: string;
}

export type DomainErrorConstructor = new (...args: any[]) => any;

export class DomainErrorMapperRegistry {
  private static readonly errorMap = new Map<
    DomainErrorConstructor,
    ErrorMapping
  >();

  static register(errorClass: DomainErrorConstructor, mapping: ErrorMapping) {
    this.errorMap.set(errorClass, mapping);
  }

  static getMapping(error: object): ErrorMapping | null {
    return (
      this.errorMap.get(error.constructor as DomainErrorConstructor) || null
    );
  }
}
