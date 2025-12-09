import { UserMapper } from '../../../users/presentation/mappers/user.mapper';

import { FileDto, FilesDto } from '../dtos/file.dto';
import { FileVersionDto } from '../dtos/file-version.dto';
import { FileVersionMapper } from './file-version.mapper';
import { FileEntity } from '../../infrastructure/entity/file.entity';

export interface Files {
  nodes: FileEntity[];
  totalCount: number;
}

export class FileMapper {
  static toDto = (entity: FileEntity): FileDto => ({
    id: entity.id,
    name: entity.name,
    description: entity.description,
    lastVersion: entity.lastVersion ? FileVersionMapper.toDto(entity.lastVersion) : undefined,
    lastVersionId: entity.lastVersionId,
    versions: entity.versions
      ? entity.versions.map((version) => FileVersionMapper.toDto(version))
      : ([] as FileVersionDto[]),
    user: entity.user ? UserMapper.toDto(UserMapper.toDomain(entity.user)) : undefined,
    userId: entity.userId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });
  static toDtoList = (files: FileEntity[], totalCount: number): FilesDto => ({
    nodes: files.map(FileMapper.toDto),
    totalCount,
  });
}
