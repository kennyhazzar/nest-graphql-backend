import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindManyOptions, FindOneOptions, Repository, UpdateResult } from 'typeorm';

import { UserRoleRepository } from '@/modules/users/domain/repositories/user-role.repository';
import { UserRoleEntity } from '../entity';
import { RoleType } from '@/enums/role-type.enum';
import { IdType } from '@/interfaces/id.type';
import { UserRole, Roles } from '../../domain/entities';
import { UserRoleMapper } from '../../presentation/mappers';

@Injectable()
export class UserRoleRepositoryImpl extends UserRoleRepository {
  constructor(
    @InjectRepository(UserRoleEntity)
    private readonly roleRepository: Repository<UserRoleEntity>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {
    super();
  }

  async find(options?: FindManyOptions<UserRoleEntity>): Promise<Roles> {
    const [roles, totalCount] = await this.roleRepository.findAndCount({
      ...options,
      cache: {
        id: JSON.stringify({ ...options, entity: 'UserRoleEntity' }),
        milliseconds: 360 * 1000,
      },
    });
    return UserRoleMapper.toDomainList(roles, totalCount);
  }

  async findOne(options: FindOneOptions<UserRoleEntity>): Promise<UserRole | null> {
    const role = await this.roleRepository.findOne({
      ...options,
      cache: {
        id: JSON.stringify({ ...options, entity: 'UserRoleEntity' }),
        milliseconds: 360 * 1000,
      },
    });
    return role ? UserRoleMapper.toDomain(role) : null;
  }

  async findById(id: IdType, options?: FindOneOptions<UserRoleEntity>): Promise<UserRole | null> {
    const role = await this.roleRepository.findOne({
      ...options,
      where: { ...options?.where, id },
    });
    return role ? UserRoleMapper.toDomain(role) : null;
  }

  async findByType(type: RoleType): Promise<UserRole | null> {
    const role = await this.roleRepository.findOne({
      where: { type },
      order: { createdAt: 'DESC' },
      loadEagerRelations: false,
      cache: {
        id: JSON.stringify({ type, entity: 'UserRoleEntity' }),
        milliseconds: 360 * 1000,
      },
    });
    return role ? UserRoleMapper.toDomain(role) : null;
  }

  async clearCache(): Promise<void> {
    const cache = this.entityManager.connection.queryResultCache;
    if (cache) {
      await cache.clear();
    }
  }

  async create(role: Pick<UserRoleEntity, 'name' | 'description' | 'type'>): Promise<UserRole> {
    const savedRole = await this.entityManager.transaction(async (tran) => {
      const newRole = await tran.save(UserRoleEntity, this.roleRepository.create(role));
      if (!newRole) {
        throw new BadRequestException('user.role.failedToSave');
      }
      return newRole;
    });

    await this.clearCache();
    return UserRoleMapper.toDomain(savedRole);
  }

  async update(roleId: IdType, role: Partial<Pick<UserRoleEntity, 'name' | 'description' | 'type'>>): Promise<UpdateResult> {
    const savedRole = await this.entityManager.transaction(async (tran) => {
      const existing = await tran.findOne(UserRoleEntity, { where: { id: roleId }, loadEagerRelations: false });
      if (!existing) {
        throw new NotFoundException('user.role.notFound');
      }

      if (typeof role.name !== 'string') {
        role.name = existing.name;
      }
      if (typeof role.description !== 'string') {
        role.description = existing.description;
      }
      if (!role.type) {
        role.type = existing.type;
      }
      const updated = await tran.save(UserRoleEntity, { id: roleId, ...role });
      if (!updated) {
        throw new BadRequestException('user.role.failedToUpdate');
      }
      return updated;
    });

    await this.clearCache();
    return { affected: 1 } as UpdateResult;
  }

  async delete(roleId: IdType): Promise<UpdateResult> {
    const result = await this.entityManager.transaction(async (tran) => {
      const existing = await tran.findOne(UserRoleEntity, { where: { id: roleId }, loadEagerRelations: false });
      if (!existing) {
        throw new NotFoundException('user.role.notFound');
      }
      return tran.softDelete(UserRoleEntity, { id: roleId });
    });

    if (result.affected && result.affected > 0) {
      await this.clearCache();
    }

    return result;
  }
}
