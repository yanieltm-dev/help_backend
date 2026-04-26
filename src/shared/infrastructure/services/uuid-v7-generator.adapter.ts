import { IIdGenerator } from '@/shared/domain/ports/id-generator.port';
import { generateUuidV7 } from '@/shared/utils/uuid';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UuidV7Generator implements IIdGenerator {
  generate(): string {
    return generateUuidV7();
  }
}
