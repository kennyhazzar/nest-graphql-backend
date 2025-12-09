import { FastifyReply } from 'fastify';
import { FindManyOptions, FindOneOptions, UpdateResult } from 'typeorm';

import type { IdType } from '@/interfaces/id.type';
import { RoleType } from '@/enums/role-type.enum';
import { FileFrom } from '@/enums/file-from.enum';
import { FileEntity } from '../../infrastructure/entity/file.entity';
import { FileUpdateInput, FileUploadInput } from '../../presentation/dtos/file.dto';
import { FileVersionEntity } from '../../infrastructure';

export interface Files {
  nodes: FileEntity[];
  totalCount: number;
}

export abstract class FileRepository {
  abstract count(options?: FindManyOptions<FileEntity>): Promise<number>;

  abstract find(options?: FindManyOptions<FileEntity>): Promise<Files>;

  abstract findById(id: string, options?: FindOneOptions<FileEntity>): Promise<FileEntity | null>;

  abstract findVersion(fileId: IdType, options?: FindManyOptions<FileVersionEntity>): Promise<FileVersionEntity[]>;

  abstract findVersionById(
    fileVersionId: IdType,
    options?: FindOneOptions<FileVersionEntity>,
  ): Promise<FileVersionEntity | null>;

  abstract download({
    reply,
    fileId,
    versionId,
    currentUserId,
    currentRoleType,
  }: {
    reply: FastifyReply;
    fileId: IdType;
    versionId?: IdType;
    currentUserId?: IdType;
    currentRoleType?: RoleType;
  }): Promise<void>;

  abstract findBy(
    payload: { id: string; module?: FileFrom },
    options?: FindOneOptions<FileEntity>,
  ): Promise<FileEntity | null>;

  abstract uploads(currentUserId: IdType, file: FileUploadInput[]): Promise<Files>;

  abstract update(fileId: string, update: FileUpdateInput): Promise<FileEntity>;

  abstract updateVersion(fileId: string, lastVersionId: IdType): Promise<UpdateResult>;

  abstract delete(id: string): Promise<UpdateResult>;
}
