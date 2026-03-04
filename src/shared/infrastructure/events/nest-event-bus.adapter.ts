import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventBus } from '../../domain/ports/event-bus.port';
import { DomainEvent } from '../../domain/events/domain-event';

@Injectable()
export class NestEventBusAdapter implements IEventBus {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: DomainEvent): void {
    this.eventEmitter.emit(event.eventName, event);
  }
}
