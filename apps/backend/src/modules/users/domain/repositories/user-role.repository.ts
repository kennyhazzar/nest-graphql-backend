import { DeepPartial, FindManyOptions, FindOneOptions, UpdateResult } from 'typeorm';

import { IdType } from '@/interfaces/id.type';
import { RoleType } from '@/enums/role-type.enum';
import { UserRoleEntity } from '@/modules/users/infrastructure/entity';
import { UserRole, Roles } from '../entities';

/**
 * Abstract repository for user roles
 */
export abstract class UserRoleRepository {
  abstract find(options?: FindManyOptions<UserRoleEntity>): Promise<Roles>;

  abstract findOne(options: FindOneOptions<UserRoleEntity>): Promise<UserRole | null>;

  abstract findById(id: IdType, options?: FindOneOptions<UserRoleEntity>): Promise<UserRole | null>;

  abstract findByType(type: RoleType): Promise<UserRole | null>;

  abstract create(role: DeepPartial<UserRoleEntity>): Promise<UserRole>;

  abstract update(id: IdType, update: DeepPartial<UserRoleEntity>): Promise<UpdateResult>;

  abstract delete(id: IdType): Promise<UpdateResult>;

  abstract clearCache(): Promise<void>;
}
