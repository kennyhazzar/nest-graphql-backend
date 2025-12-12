import { Resolver, Query, Mutation, Subscription, Args, Int, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { IdType } from '@/interfaces/id.type';
import { CurrentUserId } from '@/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { NotificationDto, NotificationsDto } from '../dtos/notification.dto';
import { NotificationFilterInput } from '../dtos/notification.input';
import { NotificationsGetQuery } from '../../application/queries/notifications-get.query';
import { NotificationUnreadCountQuery } from '../../application/queries/notification-unread-count.query';
import { NotificationMarkReadCommand } from '../../application/commands/notification-mark-read.command';
import { NotificationMarkAllReadCommand } from '../../application/commands/notification-mark-all-read.command';
import { NotificationDeleteCommand } from '../../application/commands/notification-delete.command';
import { NotificationPubSubService, NotificationPayload } from '../../infrastructure/services/notification-pubsub.service';

@Resolver(() => NotificationDto)
export class NotificationResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly notificationPubSub: NotificationPubSubService,
  ) {}

  /**
   * Get notifications for current user with pagination and filters
   */
  @Query(() => NotificationsDto, {
    name: 'notifications',
    description: 'Get notifications for current user',
  })
  @UseGuards(JwtAuthGuard)
  async notifications(
    @CurrentUserId() userId: IdType,
    @Args('input', { nullable: true }) input?: NotificationFilterInput,
  ): Promise<NotificationsDto> {
    return this.queryBus.execute(
      new NotificationsGetQuery(userId, {
        isRead: input?.isRead,
        take: input?.take ?? 20,
        skip: input?.skip ?? 0,
      }),
    );
  }

  /**
   * Get unread notifications count for current user
   */
  @Query(() => Int, {
    name: 'notificationUnreadCount',
    description: 'Get unread notifications count',
  })
  @UseGuards(JwtAuthGuard)
  async notificationUnreadCount(@CurrentUserId() userId: IdType): Promise<number> {
    return this.queryBus.execute(new NotificationUnreadCountQuery(userId));
  }

  /**
   * Mark a single notification as read
   */
  @Mutation(() => Boolean, {
    name: 'notificationMarkRead',
    description: 'Mark notification as read',
  })
  @UseGuards(JwtAuthGuard)
  async notificationMarkRead(
    @CurrentUserId() userId: IdType,
    @Args('id', { type: () => ID }) id: IdType,
  ): Promise<boolean> {
    return this.commandBus.execute(new NotificationMarkReadCommand(userId, id));
  }

  /**
   * Mark all notifications as read for current user
   */
  @Mutation(() => Int, {
    name: 'notificationMarkAllRead',
    description: 'Mark all notifications as read, returns count of updated',
  })
  @UseGuards(JwtAuthGuard)
  async notificationMarkAllRead(@CurrentUserId() userId: IdType): Promise<number> {
    return this.commandBus.execute(new NotificationMarkAllReadCommand(userId));
  }

  /**
   * Delete a notification
   */
  @Mutation(() => Boolean, {
    name: 'notificationDelete',
    description: 'Delete notification',
  })
  @UseGuards(JwtAuthGuard)
  async notificationDelete(
    @CurrentUserId() userId: IdType,
    @Args('id', { type: () => ID }) id: IdType,
  ): Promise<boolean> {
    return this.commandBus.execute(new NotificationDeleteCommand(userId, id));
  }

  /**
   * Subscribe to new notifications for current user
   * Requires WebSocket connection with JWT token in connectionParams
   */
  @Subscription(() => NotificationDto, {
    name: 'onNotification',
    description: 'Subscribe to new notifications for current user',
    filter: (payload: NotificationPayload, _variables: unknown, context: { userId?: IdType }) => {
      // Additional filter to ensure notification is for this user
      return payload?.notification?.userId === context.userId;
    },
    resolve: (payload: NotificationPayload) => payload.notification,
  })
  onNotification(@CurrentUserId() userId: IdType) {
    // Subscribe to user-specific channel
    return this.notificationPubSub.subscribeToUserNotifications(userId);
  }
}
