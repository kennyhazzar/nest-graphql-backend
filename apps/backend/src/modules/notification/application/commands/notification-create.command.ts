import { Command } from '@nestjs/cqrs';
import { IdType } from '@/interfaces/id.type';
import { NotificationType } from '@/enums/notification-type.enum';
import { NotificationDto } from '../../presentation/dtos/notification.dto';

export interface NotificationCreatePayload {
  userId: IdType;
  title: string;
  content: string;
  type?: NotificationType;
  metadata?: Record<string, any>;
}

export class NotificationCreateCommand extends Command<NotificationDto> {
  constructor(public readonly payload: NotificationCreatePayload) {
    super();
  }
}
