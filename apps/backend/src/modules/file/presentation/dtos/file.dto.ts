import { ObjectType, Field, ID, InputType } from '@nestjs/graphql';
import { FileUpload, GraphQLUpload } from 'graphql-upload-minimal';
import { IsUUID } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import type { IdType } from '@/interfaces/id.type';
import type { I18nTranslations } from '@/i18n';
import { FileFrom } from '@/enums/file-from.enum';
import { FileType } from '@/enums/file-type.enum';
import { Paginated } from '@/common/Paginated';
import { UserDto } from '../../../users/presentation/dtos/user.dto';
import { FileVersionDto } from './file-version.dto';

@ObjectType('File', { description: 'Файл' })
export class FileDto {
  @Field(() => ID, { description: 'ID файла' })
  id!: IdType;

  @Field({ description: 'Имя файла' })
  name!: string;

  @Field({ nullable: true, description: 'Описание файла' })
  description?: string;

  @Field(() => FileVersionDto, { nullable: true, description: 'Последняя версия файла' })
  lastVersion?: FileVersionDto;

  @Field(() => String, { nullable: true, description: 'ID последней версии файла' })
  lastVersionId?: IdType;

  @Field(() => [FileVersionDto], { nullable: 'items', description: 'Версии файла' })
  versions?: FileVersionDto[];

  @Field(() => UserDto, { nullable: true, description: 'Пользователь, создавший файл' })
  user?: UserDto;

  @Field(() => String, { description: 'ID пользователя, создавшего файл' })
  userId!: IdType;

  @Field(() => Date, { nullable: true, description: 'Дата создания файла' })
  createdAt?: Date;

  @Field(() => Date, { nullable: true, description: 'Дата обновления файла' })
  updatedAt?: Date;
}

@ObjectType('Files', { description: 'Список файлов' })
export class FilesDto extends Paginated(FileDto) {}

export interface IFileExtra {
  name?: string;
  description?: string;
  module?: FileFrom;
  externalId?: string;
}

@InputType('FileUploadInput', { description: 'Входные данные для загрузки файла' })
export class FileUploadInput implements IFileExtra {
  @Field({ description: 'Имя файла вместе с путем' })
  name!: string;

  @Field({ description: 'Описание файла', nullable: true })
  description?: string;

  @Field(() => FileFrom, { description: 'Из какого модуля загружается файл' })
  module!: FileFrom;

  @Field(() => String, { description: 'ID внешнего ресурса (пользователь ID и т.д.)' })
  @IsUUID('all', { message: i18nValidationMessage<I18nTranslations>('validation.IS_UUID') })
  externalId!: IdType;

  @Field(() => FileType, {
    description: 'Тип файла (документация, картинка, видео, и т.д.)',
  })
  type!: FileType;

  @Field(() => GraphQLUpload, { description: 'Файлы для загрузки' })
  file!: Promise<FileUpload>;
}

@InputType('FileUpdateInput', { description: 'Входные данные для обновления файла' })
export class FileUpdateInput implements IFileExtra {
  @Field(() => String, { description: 'ID файла' })
  id!: IdType;

  @Field({ nullable: true, description: 'Имя файла вместе с путем' })
  name?: string;

  @Field({ description: 'Описание файла', nullable: true })
  description?: string;

  @Field(() => GraphQLUpload, { nullable: true, description: 'Файлы для загрузки' })
  file?: Promise<FileUpload>;
}
