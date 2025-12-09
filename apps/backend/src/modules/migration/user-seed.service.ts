import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { isStrongPassword } from 'class-validator';
import { EntityManager } from 'typeorm';

import { RoleType } from '@/enums';
import { IdType } from '@/interfaces/id.type';
import { UserEntity, AuthServiceAdapter } from '../users/infrastructure';
import { RolesSeedService } from './roles-seed.service';
import { UserRepository, UserRoleRepository } from '../users/domain/repositories';

@Injectable()
export class UserSeedService {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly userRoleRepository: UserRoleRepository,
    private readonly rolesSeedService: RolesSeedService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async seedIfEmpty(): Promise<IdType> {
    if (process.env.NODE_ENV === 'test') {
      await this.entityManager.transaction(async (tran) => {
        // Clear tables before seeding in test environment
        await tran.query('TRUNCATE TABLE "user" CASCADE');
        await tran.query('TRUNCATE TABLE "role_permission" CASCADE');
        await tran.query('TRUNCATE TABLE "user_role" CASCADE');
        await tran.query('TRUNCATE TABLE "refresh" CASCADE');
      });

      // Clear cache after TRUNCATE
      this.logger.debug('Clearing cache after TRUNCATE');
      await this.userRoleRepository.clearCache();
    }

    // Initialize roles
    this.logger.debug('Seeding roles');
    await this.rolesSeedService.seedRolesIfEmpty();

    // Initialize permissions
    this.logger.debug('Seeding role permissions');
    await this.rolesSeedService.seedRolePermissionsIfEmpty();

    // Initialize admin user
    this.logger.debug('Seeding admin user');
    const userAdminId = await this.fillAdminUserId();

    return userAdminId;
  }

  async fillAdminUserId(): Promise<IdType> {
    const userAdminId = await this.userRepository.findIdWithRoleType(RoleType.ADMIN);
    if (!userAdminId) {
      return this.entityManager.transaction(async (tran) => {
        const password = this.configService.getOrThrow<string>('admin.password');
        if (
          !isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 })
        ) {
          throw new Error('Admin password must be at least 8 characters long and strong');
        }
        const roleAdmin = await this.userRoleRepository.findByType(RoleType.ADMIN);
        if (!roleAdmin) {
          throw new Error('Role for admin user not found');
        }
        // Create admin user
        const { identifiers } = await tran.upsert(
          UserEntity,
          {
            email: this.configService.getOrThrow<string>('admin.email'),
            password: AuthServiceAdapter.hashPassword(password),
            role: roleAdmin,
            surname: 'Super',
            name: 'Admin',
            middleName: 'User',
            verified: true,
          },
          { conflictPaths: ['email'] },
        );
        if (identifiers.length === 0 || !identifiers[0].id) {
          throw new Error('Failed to create admin user');
        }
        return identifiers[0].id;
      });
    }
    return userAdminId;
  }
}
