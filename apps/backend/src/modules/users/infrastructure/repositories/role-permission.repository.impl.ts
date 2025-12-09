import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, In, Repository } from 'typeorm';

import { RoleType } from '@/enums/role-type.enum';
import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { RolePermissionRepository } from '../../domain/repositories/role-permission.repository';
import { RolePermissionEntity } from '../entity/role-permission.entity';

/**
 * Repository implementation for role permissions
 */
@Injectable()
export class RolePermissionRepositoryImpl implements RolePermissionRepository {
  constructor(
    @InjectRepository(RolePermissionEntity)
    private readonly repository: Repository<RolePermissionEntity>,
  ) {}

  find = async (options?: FindManyOptions<RolePermissionEntity>): Promise<RolePermissionEntity[]> =>
    this.repository.find(options);

  findAndCount = async (
    options?: FindManyOptions<RolePermissionEntity>,
  ): Promise<[RolePermissionEntity[], totalCount: number]> => this.repository.findAndCount(options);

  findByRoleType = async (roleType: RoleType): Promise<RolePermissionEntity[]> =>
    this.repository.find({
      where: { roleType, isActive: true },
      select: { roleType: true, action: true, subject: true },
      order: { subject: 'ASC', action: 'ASC' },
    });

  async hasPermission(roleType: RoleType, action: Actions, subject: Subjects[] | Subjects): Promise<boolean> {
    const count = await this.repository.count({
      where: { roleType, action, subject: In(Array.isArray(subject) ? subject : [subject]), isActive: true },
    });
    return count > 0;
  }

  async create(permission: Partial<RolePermissionEntity>): Promise<RolePermissionEntity> {
    const entity = this.repository.create(permission);
    return this.repository.save(entity);
  }

  async createMany(permissions: Partial<RolePermissionEntity>[]): Promise<RolePermissionEntity[]> {
    return this.repository.save(this.repository.create(permissions));
  }

  async deleteByRoleType(roleType: RoleType): Promise<void> {
    await this.repository.delete({ roleType });
  }

  async deleteAll(): Promise<void> {
    await this.repository.clear();
  }

  async count(): Promise<number> {
    return this.repository.count({ loadEagerRelations: false });
  }
}
