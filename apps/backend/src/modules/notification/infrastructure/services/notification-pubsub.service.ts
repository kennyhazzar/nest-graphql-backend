import { Injectable, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

import { IdType } from '@/interfaces/id.type';
import { NotificationDto } from '../../presentation/dtos/notification.dto';

export const NOTIFICATION_TOPIC_PREFIX = 'USER_NOTIFICATIONS';

export interface NotificationPayload {
  notification: NotificationDto;
}

@Injectable()
export class NotificationPubSubService {
  constructor(@Inject('PubSub') private readonly pubSub: PubSub) {}

  /**
   * Publishes a notification to a specific user's channel
   * @param userId - Target user ID
   * @param notification - Notification DTO to publish
   */
  async publishToUser(userId: IdType, notification: NotificationDto): Promise<void> {
    const topic = `${NOTIFICATION_TOPIC_PREFIX}:${userId}`;
    await this.pubSub.publish(topic, { notification } as NotificationPayload);
  }

  /**
   * Publishes a notification to multiple users
   * @param userIds - Array of user IDs
   * @param notification - Notification DTO to publish
   */
  async publishToUsers(userIds: IdType[], notification: NotificationDto): Promise<void> {
    await Promise.all(userIds.map((userId) => this.publishToUser(userId, notification)));
  }

  /**
   * Creates an async iterator for subscribing to a user's notifications
   * @param userId - User ID to subscribe to
   */
  subscribeToUserNotifications(userId: IdType) {
    const topic = `${NOTIFICATION_TOPIC_PREFIX}:${userId}`;
    return this.pubSub.asyncIterableIterator(topic);
  }

  /**
   * Direct access to PubSub for advanced use cases
   */
  getPubSub(): PubSub {
    return this.pubSub;
  }
}
