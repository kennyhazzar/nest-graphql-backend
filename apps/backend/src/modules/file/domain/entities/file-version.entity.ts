import { IdType } from '@/interfaces/id.type';
import { FileVersionEntity } from '../../infrastructure/entity/file-version.entity';

export class FileVersions {
  constructor(
    public readonly nodes: FileVersion[],
    public readonly totalCount: number,
  ) {}
}

export class FileVersion extends FileVersionEntity {
  constructor(entity: FileVersionEntity) {
    super();
    Object.assign(this, entity);
  }

  static create(entity: Omit<FileVersionEntity, 'id'>): FileVersion {
    return new FileVersion({ ...entity, id: undefined as unknown as IdType });
  }
}
