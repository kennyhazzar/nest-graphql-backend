import { Column, Entity, Index } from 'typeorm';

import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { RoleType } from '@/enums/role-type.enum';
import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';

/**
 * Role permissions entity
 */
@Entity('role_permission', { comment: 'Role permissions' })
@Index('isactive_role_idx', ['isActive', 'roleType'])
@Index('isactive_role_permission_idx', ['isActive', 'roleType', 'action', 'subject'])
export class RolePermissionEntity extends BaseUUIDMixin('role_permission') {
  @Column({
    type: 'enum',
    enum: RoleType,
    enumName: 'RoleType',
    comment: 'Role type',
  })
  roleType!: RoleType;

  @Column({
    type: 'enum',
    enum: Actions,
    enumName: 'Actions',
    comment: 'Action (CRUD)',
  })
  action!: Actions;

  @Column({
    type: 'enum',
    enum: Subjects,
    enumName: 'Subjects',
    comment: 'Access subject',
  })
  subject!: Subjects;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Permission description',
    nullable: true,
  })
  description?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Is permission active',
  })
  isActive!: boolean;
}
