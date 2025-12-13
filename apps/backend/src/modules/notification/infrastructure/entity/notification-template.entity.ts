import { Column, Entity, Index } from 'typeorm';

import { BaseUUIDMixin } from '@/common/base.uuid.entity';

@Entity('notification_template', { comment: 'Notification templates' })
@Index(['name'], { unique: true })
export class NotificationTemplateEntity extends BaseUUIDMixin('notification_template') {
  @Column({ type: 'varchar', length: 100, comment: 'Template name (unique identifier)' })
  name!: string;

  @Column({ type: 'varchar', length: 500, comment: 'Subject template' })
  subject!: string;

  @Column({ type: 'text', comment: 'Content template (supports placeholders like {userName})' })
  content!: string;

  @Column({ type: 'boolean', default: true, comment: 'Is template active' })
  isActive!: boolean;
}
