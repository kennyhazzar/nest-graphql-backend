import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { NotificationsGetQuery } from '../queries/notifications-get.query';
import { NotificationRepository } from '../../domain/repositories/notification.repository';
import { NotificationMapper } from '../../presentation/mappers/notification.mapper';
import { NotificationsDto } from '../../presentation/dtos/notification.dto';

@QueryHandler(NotificationsGetQuery)
export class NotificationsGetHandler implements IQueryHandler<NotificationsGetQuery, NotificationsDto> {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async execute(query: NotificationsGetQuery): Promise<NotificationsDto> {
    const { userId, options } = query;
    const notifications = await this.notificationRepository.findByUserId(userId, options);
    return NotificationMapper.toDtoList(notifications);
  }
}
