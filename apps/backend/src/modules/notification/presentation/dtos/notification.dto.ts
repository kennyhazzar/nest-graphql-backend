import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

import { IdType } from '@/interfaces/id.type';
import { NotificationType } from '@/enums/notification-type.enum';
import { Paginated } from '@/common/Paginated';

@ObjectType('Notification')
export class NotificationDto {
  @Field(() => ID)
  id!: IdType;

  @Field(() => ID)
  userId!: IdType;

  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field(() => NotificationType)
  type!: NotificationType;

  @Field()
  isRead!: boolean;

  @Field({ nullable: true, description: 'JSON string with additional metadata' })
  metadata?: string;

  @Field(() => Date)
  createdAt!: Date;
}

@ObjectType('Notifications')
export class NotificationsDto extends Paginated(NotificationDto) {
  @Field(() => Int)
  unreadCount!: number;
}
