import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { NotificationType } from '@/enums/notification-type.enum';

@InputType('NotificationFilterInput')
export class NotificationFilterInput {
  @Field(() => Boolean, { nullable: true })
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  @IsOptional()
  isRead?: boolean;

  @Field(() => NotificationType, { nullable: true })
  @IsEnum(NotificationType, { message: i18nValidationMessage('validation.IS_ENUM') })
  @IsOptional()
  type?: NotificationType;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1)
  @Max(100)
  @IsOptional()
  take?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(0)
  @IsOptional()
  skip?: number;
}
