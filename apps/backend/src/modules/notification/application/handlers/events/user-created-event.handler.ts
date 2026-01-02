import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { I18nService } from 'nestjs-i18n';
import { UserCreatedEvent } from '@/modules/users/application/events';
import { NotificationCreateCommand } from '../../commands/notification-create.command';
import { NotificationType } from '@/enums/notification-type.enum';

/**
 * Event Handler for UserCreatedEvent
 *
 * Listens to UserCreatedEvent and creates a welcome notification for the new user.
 * This demonstrates Event-Driven Architecture in the template.
 *
 * Key features:
 * - Event-driven communication between modules (users → notifications)
 * - i18n support for notification content
 * - Decoupled architecture (users module doesn't know about notifications)
 */
@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly i18n: I18nService,
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    const { userId, name, surname } = event;

    const fullName = surname ? `${name} ${surname}` : name;

    // Get localized notification content
    const title = this.i18n.translate('notification.welcome.title');
    const content = this.i18n.translate('notification.welcome.content', {
      args: { name: fullName },
    });

    // Create welcome notification
    await this.commandBus.execute(
      new NotificationCreateCommand({
        userId,
        title,
        content,
        type: NotificationType.SUCCESS,
        metadata: {
          eventType: 'user_created',
          createdAt: new Date().toISOString(),
        },
      }),
    );
  }
}
