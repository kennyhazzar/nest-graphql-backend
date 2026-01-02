import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';

import { GraphqlSubscriptionsPubsubFactory } from '@/factories/graphql-subscriptions-pubsub.factory';

// Infrastructure
import { NotificationEntity } from './infrastructure/entity/notification.entity';
import { NotificationTemplateEntity } from './infrastructure/entity/notification-template.entity';
import { NotificationRepositoryImpl } from './infrastructure/repositories/notification-repository.impl';
import { NotificationPubSubService } from './infrastructure/services/notification-pubsub.service';

// Domain
import { NotificationRepository } from './domain/repositories/notification.repository';

// Application
import { NotificationCreateHandler } from './application/handlers/notification-create.handler';
import { NotificationMarkReadHandler } from './application/handlers/notification-mark-read.handler';
import { NotificationMarkAllReadHandler } from './application/handlers/notification-mark-all-read.handler';
import { NotificationDeleteHandler } from './application/handlers/notification-delete.handler';
import { NotificationsGetHandler } from './application/handlers/notifications-get.handler';
import { NotificationUnreadCountHandler } from './application/handlers/notification-unread-count.handler';
import { UserCreatedEventHandler } from './application/handlers/events';

// Presentation
import { NotificationResolver } from './presentation/resolvers/notification.resolver';

const CommandHandlers = [
  NotificationCreateHandler,
  NotificationMarkReadHandler,
  NotificationMarkAllReadHandler,
  NotificationDeleteHandler,
];

const QueryHandlers = [NotificationsGetHandler, NotificationUnreadCountHandler];

const EventHandlers = [UserCreatedEventHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([NotificationEntity, NotificationTemplateEntity])],
  providers: [
    NotificationResolver,
    NotificationPubSubService,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    {
      provide: NotificationRepository,
      useClass: NotificationRepositoryImpl,
    },
    {
      provide: 'PubSub',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pubsubFactory = new GraphqlSubscriptionsPubsubFactory(configService);
        return pubsubFactory.createPubSub();
      },
    },
  ],
  exports: [NotificationRepository, NotificationPubSubService, 'PubSub'],
})
export class NotificationModule {}
