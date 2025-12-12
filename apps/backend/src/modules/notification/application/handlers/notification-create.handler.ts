import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { NotificationType } from '@/enums/notification-type.enum';
import { NotificationCreateCommand } from '../commands/notification-create.command';
import { NotificationRepository } from '../../domain/repositories/notification.repository';
import { NotificationPubSubService } from '../../infrastructure/services/notification-pubsub.service';
import { NotificationMapper } from '../../presentation/mappers/notification.mapper';
import { NotificationDto } from '../../presentation/dtos/notification.dto';

@CommandHandler(NotificationCreateCommand)
export class NotificationCreateHandler implements ICommandHandler<NotificationCreateCommand, NotificationDto> {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationPubSub: NotificationPubSubService,
  ) {}

  async execute(command: NotificationCreateCommand): Promise<NotificationDto> {
    const { payload } = command;

    const notification = await this.notificationRepository.create({
      userId: payload.userId,
      title: payload.title,
      content: payload.content,
      type: payload.type ?? NotificationType.INFO,
      isRead: false,
      metadata: payload.metadata,
    });

    const dto = NotificationMapper.toDto(notification);

    // Publish to WebSocket subscribers
    await this.notificationPubSub.publishToUser(payload.userId, dto);

    return dto;
  }
}
