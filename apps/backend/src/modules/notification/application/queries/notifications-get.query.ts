import { Query } from '@nestjs/cqrs';
import { IdType } from '@/interfaces/id.type';
import { NotificationFilterOptions } from '../../domain/repositories/notification.repository';
import { NotificationsDto } from '../../presentation/dtos/notification.dto';

export class NotificationsGetQuery extends Query<NotificationsDto> {
  constructor(
    public readonly userId: IdType,
    public readonly options?: NotificationFilterOptions,
  ) {
    super();
  }
}
