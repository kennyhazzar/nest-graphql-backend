import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { UseGuards } from '@nestjs/common';
import { GraphQLResolveInfo } from 'graphql';
import { Args, Info, Mutation, Query, Resolver } from '@nestjs/graphql';

import type { IdType } from '@/interfaces/id.type';
import type { RoleType } from '@/enums/role-type.enum';
import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { CurrentUserId, CurrentRoleId, Policy, CurrentRoleType } from '@/decorators';
import { JwtAuthGuard, PoliciesGuard } from '@/guards';
import { GraphqlSearchQuery, SearchQuery } from '@/common/graphql-search-query';
import {
  FileDto,
  FilesDto,
  FileUploadInput,
  FileUpdateInput,
} from '../dtos/file.dto';
import {
  FilesGetQuery,
  FilesUploadCommand,
  FileUpdateCommand,
  FileDeleteCommand,
} from '../../application';
import { FileEntity } from '../../infrastructure';

/**
 * GraphQL резолвер для работы с файлами
 *
 * Предоставляет GraphQL API для всех операций с файлами:
 * - Запросы для получения данных (Query)
 * - Мутации для изменения данных (Mutation)
 *
 * @description
 * Резолвер реализует следующие возможности:
 * - Загрузка файлов (filesUpload)
 * - Получение списка файлов (files)
 * - Обновление файла (fileUpdate)
 * - Удаление файла (fileDelete)
 */

@UseGuards(JwtAuthGuard, PoliciesGuard)
@Resolver(() => FileDto)
export class FileResolver {
  private static searchQuery: SearchQuery<FileEntity>;

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly graphqlQuery: GraphqlSearchQuery,
  ) {
    FileResolver.searchQuery = this.graphqlQuery.create(FileEntity);
  }

  @Mutation(() => FilesDto, { name: 'filesUpload', description: 'Загрузка файлов' })
  @Policy(Actions.CREATE, Subjects.FILE)
  async filesUpload(
    @CurrentRoleId() currentRoleId: IdType,
    @CurrentUserId() currentUserId: IdType,
    @CurrentRoleType() currentRoleType: RoleType,
    @Args('payload', { type: () => [FileUploadInput] }) payload: FileUploadInput[],
  ): Promise<FilesDto> {
    return this.commandBus.execute(new FilesUploadCommand({ currentUserId, currentRoleId, currentRoleType, payload }));
  }

  @Query(() => FilesDto, { name: 'files', description: 'Получение списка файлов' })
  @Policy(Actions.READ, Subjects.FILE)
  async files(
    @CurrentRoleId() currentRoleId: IdType,
    @CurrentUserId() currentUserId: IdType,
    @CurrentRoleType() currentRoleType: RoleType,
    @Info() info: GraphQLResolveInfo,
    @Args('payload', {
      type: () => FileResolver.searchQuery,
      description: 'Поисковый запрос для файлов',
      nullable: true,
    })
    payload: typeof FileResolver.searchQuery,
  ): Promise<FilesDto> {
    return this.queryBus.execute(new FilesGetQuery({ currentRoleId, currentUserId, currentRoleType, payload, info }));
  }

  @Mutation(() => FileDto, { name: 'fileUpdate', description: 'Обновление файла' })
  @Policy(Actions.UPDATE, Subjects.FILE)
  async fileUpdate(
    @CurrentUserId() currentUserId: IdType,
    @CurrentRoleType() currentRoleType: RoleType,
    @Args('payload', {
      type: () => FileUpdateInput,
      description: 'Входные данные для обновления файла',
    })
    payload: FileUpdateInput,
  ): Promise<FileDto> {
    return this.commandBus.execute(new FileUpdateCommand({ payload, currentUserId, currentRoleType }));
  }

  @Mutation(() => Boolean, { name: 'fileDelete', description: 'Удаление файла' })
  @Policy(Actions.DELETE, Subjects.FILE)
  async fileDelete(
    @CurrentUserId() currentUserId: IdType,
    @CurrentRoleType() currentRoleType: RoleType,
    @Args('fileId', { type: () => String, description: 'ID файла' }) fileId: IdType,
  ): Promise<boolean> {
    return this.commandBus.execute(new FileDeleteCommand({ fileId, currentUserId, currentRoleType }));
  }
}
