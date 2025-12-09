import { IdType } from '@/interfaces/id.type';

import type { UserEntity } from '../../../users/infrastructure/entity/user.entity';
import { FileEntity } from '../../infrastructure/entity/file.entity';

export class File extends FileEntity {
  constructor(entity: FileEntity) {
    super();
    Object.assign(this, entity);
  }

  static create(entity: Omit<FileEntity, 'id' | 'user'>): File {
    return new File({ ...entity, id: undefined as unknown as IdType, user: {} as UserEntity });
  }
}
