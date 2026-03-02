import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEventBus } from '../../domain/ports/event-bus.port';

@Injectable()
export class NestEventBusAdapter implements IEventBus {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publish(event: object): void {
    const constructor = event.constructor as unknown as {
      name: string;
      EVENT_NAME?: string;
    };
    const eventName = constructor.EVENT_NAME ?? constructor.name;
    this.eventEmitter.emit(eventName, event);
  }
}
