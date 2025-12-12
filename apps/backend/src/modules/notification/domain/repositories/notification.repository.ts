import { FindManyOptions, UpdateResult } from 'typeorm';
import { IdType } from '@/interfaces/id.type';
import { NotificationEntity } from '../../infrastructure/entity/notification.entity';
import { Notification, Notifications } from '../entities/notification.entity';

export interface NotificationFilterOptions {
  isRead?: boolean;
  take?: number;
  skip?: number;
}

export abstract class NotificationRepository {
  abstract create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'user'>): Promise<Notification>;
  abstract findById(id: IdType): Promise<Notification | null>;
  abstract findByIdAndUserId(id: IdType, userId: IdType): Promise<Notification | null>;
  abstract findByUserId(userId: IdType, options?: NotificationFilterOptions): Promise<Notifications>;
  abstract getUnreadCount(userId: IdType): Promise<number>;
  abstract markAsRead(id: IdType, userId: IdType): Promise<boolean>;
  abstract markAllAsRead(userId: IdType): Promise<number>;
  abstract delete(id: IdType, userId: IdType): Promise<boolean>;
}
