import { Module } from '@nestjs/common';
import { SharedAuthModule } from './auth/shared-auth.module';
import { NestEventBusAdapter } from './infrastructure/events/nest-event-bus.adapter';
import { DrizzleUnitOfWork } from './infrastructure/persistence/drizzle-unit-of-work.adapter';
import { UuidV7Generator } from './infrastructure/services/uuid-v7-generator.adapter';
import { EVENT_BUS, ID_GENERATOR, UNIT_OF_WORK } from './shared.tokens';

@Module({
  imports: [SharedAuthModule],
  providers: [
    {
      provide: EVENT_BUS,
      useClass: NestEventBusAdapter,
    },
    {
      provide: UNIT_OF_WORK,
      useClass: DrizzleUnitOfWork,
    },
    {
      provide: ID_GENERATOR,
      useClass: UuidV7Generator,
    },
  ],
  exports: [EVENT_BUS, UNIT_OF_WORK, ID_GENERATOR],
})
export class SharedModule {}
