import { registerEnumType } from '@nestjs/graphql';

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'Тип уведомления',
});
