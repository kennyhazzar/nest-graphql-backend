import { Column, Entity, Index, JoinColumn, ManyToOne, RelationId, Unique } from 'typeorm';

import { IdType } from '@/interfaces/id.type';
import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { UserEntity } from '../../../users/infrastructure/entity/user.entity';
import { FileEntity } from './file.entity';

@Entity('file-version', { comment: 'Версии файлов', orderBy: { createdAt: 'DESC' } })
@Unique('unique_version_file', ['versionId', 'fileId'])
export class FileVersionEntity extends BaseUUIDMixin('file_version') {
  @Column({ type: 'varchar' })
  mimetype!: string;

  @Column({ type: 'int', comment: 'Размер файла в байтах' })
  size!: number;

  @Index('idx_file_version_versionId')
  @Column({ type: 'varchar', comment: 'S3 версия файла' })
  versionId!: string;

  @ManyToOne(() => FileEntity, (file) => file.versions)
  @JoinColumn({ foreignKeyConstraintName: 'FK_file_version_file' })
  file?: FileEntity;

  @Column({ type: 'uuid', comment: 'Версия файла' })
  @RelationId((file: FileVersionEntity) => file.file)
  fileId!: IdType;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ foreignKeyConstraintName: 'FK_file_version_user' })
  user?: UserEntity;

  @Index('idx_file_version_userId')
  @Column({ type: 'uuid', comment: 'ID пользователя, создавшего файл' })
  @RelationId((file: FileVersionEntity) => file.user)
  userId!: IdType;
}
