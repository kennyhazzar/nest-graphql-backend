import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, RelationId, Unique } from 'typeorm';

import { IdType } from '@/interfaces/id.type';
import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { FileFrom } from '@/enums/file-from.enum';
import { FileType } from '@/enums/file-type.enum';
import { UserEntity } from '../../../users/infrastructure/entity/user.entity';
import { FileVersionEntity } from './file-version.entity';

@Entity('file', { comment: 'Файлы' })
@Unique('U_name_module_externalId', ['name', 'module', 'externalId'])
@Unique('U_name_path', ['name', 'path'])
export class FileEntity extends BaseUUIDMixin('file') {
  @Column({ type: 'varchar', length: 255, comment: 'Имя файла' })
  @Index('idx_file_name')
  name!: string;

  @Column({ type: 'varchar', comment: 'Путь к файлу' })
  @Index('idx_file_path')
  path!: string;

  @Column({ type: 'enum', enum: FileFrom, enumName: 'FileFrom', comment: 'Модуль, к которому относится файл' })
  @Index('idx_file_module')
  module!: FileFrom;

  @Column({ type: 'uuid', comment: 'ID ресурса, к которому относится файл' })
  @Index('idx_file_externalId')
  externalId!: IdType;

  @Column({ type: 'text', nullable: true, comment: 'Описание файла' })
  description?: string;

  @Column({
    type: 'enum',
    enum: FileType,
    enumName: 'FileType',
    default: FileType.OTHER,
    comment: 'Тип файла (документация, картинка, видео, и т.д.)',
  })
  type!: FileType;

  @ManyToOne(() => FileVersionEntity, (version) => version.file, {
    nullable: true,
    eager: true,
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  lastVersion?: FileVersionEntity;

  @Column({ type: 'uuid', nullable: true, comment: 'ID последней версии файла' })
  @RelationId((file: FileEntity) => file.lastVersion)
  lastVersionId?: IdType;

  @OneToMany(() => FileVersionEntity, (version) => version.file, {
    eager: false,
    cascade: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  versions?: FileVersionEntity[];

  @ManyToOne(() => UserEntity)
  @JoinColumn()
  user?: UserEntity;

  @Column({ type: 'uuid', comment: 'ID пользователя, создавшего файл' })
  @RelationId((file: FileEntity) => file.user)
  userId!: string;
}
