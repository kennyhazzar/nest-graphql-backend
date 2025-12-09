import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseUUIDMixin } from '@/common/base.uuid.entity';
import { RoleType } from '@/enums/role-type.enum';
import { UserEntity } from './user.entity';

@Entity('user_role', { comment: 'User roles' })
@Index('idx_user_role_type', ['type'])
export class UserRoleEntity extends BaseUUIDMixin('user_role') {
  @Column({ type: 'varchar', length: 100, unique: true, comment: 'Role name' })
  name!: string;

  @Column({ type: 'varchar', length: 255, default: '', comment: 'Role description' })
  description?: string;

  @Column({
    type: 'enum',
    enum: RoleType,
    enumName: 'RoleType',
    comment: 'User role type',
    default: RoleType.USER,
  })
  type!: RoleType;

  @OneToMany(() => UserEntity, (user) => user.role)
  users?: UserEntity[];
}
