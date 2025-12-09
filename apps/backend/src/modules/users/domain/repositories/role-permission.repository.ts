import { FindManyOptions } from 'typeorm';

import type { RoleType } from '@/enums/role-type.enum';
import type { Actions } from '@/enums/actions.enum';
import type { Subjects } from '@/enums/subjects.enum';
import { RolePermissionEntity } from '@/modules/users/infrastructure/entity/role-permission.entity';

/**
 * Abstract repository for role permissions
 */
export abstract class RolePermissionRepository {
  /**
   * Find all permissions
   */
  abstract find(options?: FindManyOptions<RolePermissionEntity>): Promise<RolePermissionEntity[]>;

  /**
   * Find all permissions and count
   */
  abstract findAndCount(options?: FindManyOptions<RolePermissionEntity>): Promise<[RolePermissionEntity[], number]>;

  /**
   * Find permissions for specific role
   */
  abstract findByRoleType(roleType: RoleType): Promise<RolePermissionEntity[]>;

  /**
   * Check if permission exists for role
   */
  abstract hasPermission(roleType: RoleType, action: Actions, subject: Subjects[] | Subjects): Promise<boolean>;

  /**
   * Create permission
   */
  abstract create(permission: Partial<RolePermissionEntity>): Promise<RolePermissionEntity>;

  /**
   * Create multiple permissions
   */
  abstract createMany(permissions: Partial<RolePermissionEntity>[]): Promise<RolePermissionEntity[]>;

  /**
   * Delete all permissions for role
   */
  abstract deleteByRoleType(roleType: RoleType): Promise<void>;

  /**
   * Delete all permissions (for recreation)
   */
  abstract deleteAll(): Promise<void>;

  /**
   * Count total permissions
   */
  abstract count(): Promise<number>;
}
