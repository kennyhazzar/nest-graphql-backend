import { UserMapper } from '../../../users/presentation/mappers/user.mapper';

import { FileVersionDto, FileVersionsDto } from '../dtos/file-version.dto';
import { FileVersionEntity } from '../../infrastructure/entity/file-version.entity';

export interface FileVersions {
  nodes: FileVersionEntity[];
  totalCount: number;
}

export class FileVersionMapper {
  static toDto = (entity: FileVersionEntity): FileVersionDto => ({
    id: entity.id,
    mimetype: entity.mimetype,
    size: entity.size,
    versionId: entity.versionId,
    user: entity.user ? UserMapper.toDto(UserMapper.toDomain(entity.user)) : undefined,
    userId: entity.userId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  });
  static toDtoList = (fileVersions: FileVersionEntity[], totalCount: number): FileVersionsDto => ({
    nodes: fileVersions.map(FileVersionMapper.toDto),
    totalCount,
  });
}
