import { DomainEvent } from '@/shared/domain/events/domain-event';

export class FileDeletedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'media.file.deleted' as const;

  constructor(
    public readonly fileId: string,
    public readonly ownerId: string,
  ) {
    super();
  }

  get eventName(): string {
    return FileDeletedDomainEvent.EVENT_NAME;
  }
}
