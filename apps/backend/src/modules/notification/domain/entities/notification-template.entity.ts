import { NotificationTemplateEntity } from '../../infrastructure/entity/notification-template.entity';

export class NotificationTemplateList {
  constructor(
    public readonly nodes: NotificationTemplate[],
    public readonly totalCount: number,
  ) {}
}

export class NotificationTemplate extends NotificationTemplateEntity {
  constructor(entity: NotificationTemplateEntity) {
    super();
    Object.assign(this, entity);
  }

  static create(payload: {
    name: string;
    subject: string;
    content: string;
    isActive?: boolean;
  }): Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: payload.name,
      subject: payload.subject,
      content: payload.content,
      isActive: payload.isActive ?? true,
    };
  }
}
