import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IdType } from '@/interfaces/id.type';
import { NotificationRepository, NotificationFilterOptions } from '../../domain/repositories/notification.repository';
import { Notification, Notifications } from '../../domain/entities/notification.entity';
import { NotificationEntity } from '../entity/notification.entity';

@Injectable()
export class NotificationRepositoryImpl extends NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {
    super();
  }

  async create(
    notification: Omit<NotificationEntity, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'user'>,
  ): Promise<Notification> {
    const entity = this.repo.create(notification);
    const saved = await this.repo.save(entity);
    return new Notification(saved);
  }

  async findById(id: IdType): Promise<Notification | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? new Notification(entity) : null;
  }

  async findByIdAndUserId(id: IdType, userId: IdType): Promise<Notification | null> {
    const entity = await this.repo.findOne({ where: { id, userId } });
    return entity ? new Notification(entity) : null;
  }

  async findByUserId(userId: IdType, options?: NotificationFilterOptions): Promise<Notifications> {
    const queryBuilder = this.repo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (options?.isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: options.isRead });
    }

    const totalCount = await queryBuilder.getCount();

    if (options?.skip) {
      queryBuilder.skip(options.skip);
    }

    if (options?.take) {
      queryBuilder.take(options.take);
    }

    const entities = await queryBuilder.getMany();
    const notifications = entities.map((e) => new Notification(e));

    // Get unread count separately
    const unreadCount = await this.repo.count({
      where: { userId, isRead: false },
    });

    return Notifications.create(notifications, totalCount, unreadCount);
  }

  async getUnreadCount(userId: IdType): Promise<number> {
    return this.repo.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: IdType, userId: IdType): Promise<boolean> {
    const result = await this.repo.update({ id, userId }, { isRead: true });
    return (result.affected ?? 0) > 0;
  }

  async markAllAsRead(userId: IdType): Promise<number> {
    const result = await this.repo.update({ userId, isRead: false }, { isRead: true });
    return result.affected ?? 0;
  }

  async delete(id: IdType, userId: IdType): Promise<boolean> {
    const result = await this.repo.softDelete({ id, userId });
    return (result.affected ?? 0) > 0;
  }
}
