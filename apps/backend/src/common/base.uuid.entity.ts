import { CreateDateColumn, DeleteDateColumn, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IdType } from '@/interfaces/id.type';

/**
 * Base UUID Entity Mixin
 * Provides automatic ID, timestamps and soft delete support for all entities
 */
export function BaseUUIDMixin(name: string) {
  @Index(`IDX_${name}_createdAt`, ['createdAt'])
  @Index(`IDX_${name}_updatedAt`, ['updatedAt'])
  @Index(`IDX_${name}_deletedAt`, ['deletedAt'])
  abstract class BaseUUIDEntity {
    @PrimaryGeneratedColumn('uuid', {
      comment: 'Unique identifier',
      primaryKeyConstraintName: `PK_${name}_id`,
    })
    id!: IdType;

    @CreateDateColumn({
      type: 'timestamptz',
      comment: 'Creation date',
    })
    createdAt?: Date;

    @UpdateDateColumn({
      type: 'timestamptz',
      comment: 'Update date',
    })
    updatedAt?: Date;

    @DeleteDateColumn({
      type: 'timestamptz',
      nullable: true,
      comment: 'Deletion date (soft delete)',
    })
    deletedAt?: Date | null;
  }

  return BaseUUIDEntity;
}
