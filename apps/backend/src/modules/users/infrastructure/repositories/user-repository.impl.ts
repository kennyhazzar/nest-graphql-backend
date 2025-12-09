import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, UpdateResult, In, DeepPartial, Repository, EntityManager } from 'typeorm';

import { IdType } from '@/interfaces/id.type';
import { RoleType } from '@/enums/role-type.enum';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User, Users } from '../../domain/entities';
import { UserMapper } from '../../presentation/mappers';
import { UserEntity } from '../entity/user.entity';

@Injectable()
export class UserRepositoryImpl extends UserRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {
    super();
  }

  async find(options?: FindManyOptions<UserEntity>): Promise<Users> {
    const [users, totalCount] = await this.repo.findAndCount({
      relations: { role: true },
      ...options,
    });
    return UserMapper.toDomainList(users, totalCount);
  }

  async findById(id: string, options?: FindOneOptions<UserEntity>): Promise<User | null> {
    const user = await this.repo.findOne({
      relations: { role: true },
      ...options,
      where: { ...options?.where, id },
    });

    return user ? UserMapper.toDomain(user) : null;
  }

  async findOne(options: FindOneOptions<UserEntity>): Promise<User | null> {
    const user = await this.repo.findOne(options);
    return user ? UserMapper.toDomain(user) : null;
  }

  async findByIds(ids: string[], options?: FindManyOptions<UserEntity>): Promise<Users> {
    if (options?.loadEagerRelations === false) {
      options.relations = options?.relations || {};
    }
    const [users, totalCount] = await this.repo.findAndCount({
      relations: { role: true },
      ...options,
      where: { id: In(ids) },
    });
    return UserMapper.toDomainList(users, totalCount);
  }

  async findByEmail(email: string, options?: FindOneOptions<UserEntity>): Promise<User | null> {
    if (options?.loadEagerRelations === false) {
      options.relations = options?.relations || {};
    }
    const user = await this.repo.findOne({
      relations: { role: true },
      ...options,
      where: { email },
    });
    return user ? UserMapper.toDomain(user) : null;
  }

  async create(user: User | DeepPartial<UserEntity>): Promise<User> {
    return this.entityManager.transaction(async (tran) => {
      const saved = await tran.save(tran.create(UserEntity, user));
      if (!saved) {
        throw new BadRequestException('user.failedToSave');
      }
      return UserMapper.toDomain(saved);
    });
  }

  async update(userId: IdType, update: DeepPartial<UserEntity>): Promise<UpdateResult> {
    const updatedResult = await this.repo.update(userId, this.repo.create(update));
    if (updatedResult.affected === 0) {
      throw new NotFoundException('user.notFound');
    }
    return updatedResult;
  }

  async delete(id: IdType): Promise<UpdateResult> {
    return this.repo.softDelete(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email, { select: { id: true }, loadEagerRelations: false, relations: {} });
    return user !== null;
  }

  async countByRoleAccess(roleType = RoleType.ADMIN): Promise<number> {
    return this.repo.manager
      .createQueryBuilder(UserEntity, 'user')
      .leftJoin('user.role', 'role')
      .where(`"role"."type" = :roleType`, { roleType })
      .getCount();
  }

  async findIdWithRoleType(roleType = RoleType.ADMIN): Promise<IdType | null> {
    const userWithRoleType = await this.entityManager
      .createQueryBuilder(UserEntity, 'user')
      .leftJoin('user.role', 'role')
      .where(`"role"."type" = :roleType`, { roleType })
      .select(['user.id'])
      .getOne();
    return userWithRoleType ? userWithRoleType['id'] : null;
  }
}
