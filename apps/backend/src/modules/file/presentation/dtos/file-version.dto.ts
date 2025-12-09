import { ObjectType, Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import type { IdType } from '@/interfaces/id.type';
import type { I18nTranslations } from '@/i18n';
import { Paginated } from '@/common/Paginated';
import { UserDto } from '@/modules/users/presentation/dtos/user.dto';

@ObjectType('FileVersion', { description: 'Версии файла' })
export class FileVersionDto {
  @Field(() => ID, { description: 'ID версии файла' })
  id!: IdType;

  @Field(() => String, { description: 'MIME тип файла' })
  mimetype!: string;

  @Field(() => Int, { description: 'Размер файла в байтах' })
  size!: number;

  @Field(() => String, { description: 'S3 версия файла' })
  versionId!: string;

  @Field(() => UserDto, { nullable: true, description: 'Пользователь, создавший версию файла' })
  user?: UserDto;

  @Field(() => String, { nullable: true, description: 'ID пользователя, создавшего версию файла' })
  userId!: IdType;

  @Field(() => Date, { nullable: true, description: 'Дата создания версии файла' })
  createdAt?: Date;

  @Field(() => Date, { nullable: true, description: 'Дата обновления версии файла' })
  updatedAt?: Date;
}

@ObjectType('FileVersions', { description: 'Список версий файла' })
export class FileVersionsDto extends Paginated(FileVersionDto) {}

@InputType({ description: 'Получение версий файла' })
export class FileVersionsInput {
  @Field(() => String, { description: 'ID файла' })
  @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.IS_UUID') })
  fileId!: IdType;
}
