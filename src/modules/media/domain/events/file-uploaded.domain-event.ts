import { DomainEvent } from '@/shared/domain/events/domain-event';

export class FileUploadedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'media.file.uploaded' as const;

  constructor(
    public readonly fileId: string,
    public readonly ownerId: string,
    public readonly key: string,
    public readonly publicUrl: string,
  ) {
    super();
  }

  get eventName(): string {
    return FileUploadedDomainEvent.EVENT_NAME;
  }
}
