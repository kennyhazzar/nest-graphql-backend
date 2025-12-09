import { DeepPartial, FindManyOptions, FindOneOptions, UpdateResult } from 'typeorm';

import { IdType } from '@/interfaces/id.type';
import type { RoleType } from '@/enums/role-type.enum';
import { UserEntity } from '@/modules/users/infrastructure/entity';
import { User, Users } from '../entities';

export abstract class UserRepository {
  abstract find(options?: FindManyOptions<UserEntity>): Promise<Users>;

  abstract findOne(options: FindOneOptions<UserEntity>): Promise<User | null>;

  abstract findById(id: IdType, options?: FindOneOptions<UserEntity>): Promise<User | null>;

  abstract findByIds(ids: IdType[], options?: FindManyOptions<UserEntity>): Promise<Users>;

  abstract findByEmail(email: string, options?: FindOneOptions<UserEntity>): Promise<User | null>;

  abstract create(user: User | DeepPartial<UserEntity>): Promise<User>;

  abstract update(userId: IdType, update: DeepPartial<UserEntity>): Promise<UpdateResult>;

  abstract delete(id: IdType): Promise<UpdateResult>;

  abstract existsByEmail(email: string): Promise<boolean>;

  /**
   * Count users with specific role access.
   */
  abstract countByRoleAccess(roleType?: RoleType): Promise<number>;

  /**
   * Find user ID with specific role type.
   */
  abstract findIdWithRoleType(roleType?: RoleType): Promise<IdType | null>;
}
