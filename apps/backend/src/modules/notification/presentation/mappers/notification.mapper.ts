import { Notification, Notifications } from '../../domain/entities/notification.entity';
import { NotificationDto, NotificationsDto } from '../dtos/notification.dto';

export class NotificationMapper {
  static toDto(notification: Notification): NotificationDto {
    const dto = new NotificationDto();
    dto.id = notification.id;
    dto.userId = notification.userId;
    dto.title = notification.title;
    dto.content = notification.content;
    dto.type = notification.type;
    dto.isRead = notification.isRead;
    dto.metadata = notification.metadata ? JSON.stringify(notification.metadata) : undefined;
    dto.createdAt = notification.createdAt!;
    return dto;
  }

  static toDtoList(notifications: Notifications): NotificationsDto {
    const dto = new NotificationsDto();
    dto.nodes = notifications.map((notification) => NotificationMapper.toDto(notification));
    dto.totalCount = notifications.totalCount;
    dto.unreadCount = notifications.unreadCount;
    return dto;
  }
}
