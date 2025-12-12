import { IdType } from '@/interfaces/id.type';
import { NotificationType } from '@/enums/notification-type.enum';
import { NotificationEntity as NotificationInfraEntity } from '../../infrastructure/entity/notification.entity';

export class Notification extends NotificationInfraEntity {
  constructor(entity: NotificationInfraEntity) {
    super();
    Object.assign(this, entity);
  }

  static create(
    entity: Omit<NotificationInfraEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'user'>,
  ): Notification {
    return new Notification({
      ...entity,
      id: undefined as unknown as IdType,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      user: undefined as any,
    });
  }
}

export class Notifications extends Array<Notification> {
  totalCount: number = 0;
  unreadCount: number = 0;

  static create(notifications: Notification[], totalCount?: number, unreadCount?: number): Notifications {
    const aggregate = new Notifications();
    aggregate.push(...notifications);
    aggregate.totalCount = totalCount ?? notifications.length;
    aggregate.unreadCount = unreadCount ?? notifications.filter((n) => !n.isRead).length;
    return aggregate;
  }
}
