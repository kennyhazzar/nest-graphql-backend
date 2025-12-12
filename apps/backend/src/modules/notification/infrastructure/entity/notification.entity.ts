import { Column, Entity, ManyToOne, JoinColumn, RelationId, Index } from 'typeorm';

import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { NotificationType } from '@/enums/notification-type.enum';
import { UserEntity } from '@/modules/users/infrastructure/entity/user.entity';

@Entity('notification', { comment: 'User notifications' })
@Index('IDX_notification_userId', ['userId'])
@Index('IDX_notification_isRead', ['isRead'])
@Index('IDX_notification_type', ['type'])
export class NotificationEntity extends BaseUUIDMixin('notification') {
  @Column({ type: 'uuid', comment: 'User ID' })
  @RelationId((notification: NotificationEntity) => notification.user)
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 255, comment: 'Notification title' })
  title!: string;

  @Column({ type: 'text', comment: 'Notification content' })
  content!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    enumName: 'NotificationType',
    default: NotificationType.INFO,
    comment: 'Notification type',
  })
  type!: NotificationType;

  @Column({ type: 'boolean', default: false, comment: 'Is notification read' })
  isRead!: boolean;

  @Column({ type: 'jsonb', nullable: true, comment: 'Additional metadata' })
  metadata?: Record<string, any>;
}
