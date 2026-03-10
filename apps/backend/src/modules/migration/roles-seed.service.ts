import { Injectable, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { RolePermissionRepository, RolePermissionCreatePayload, UserRoleRepository } from "@/modules/users/domain/repositories";
import { UserRoleEntity } from "@/modules/users/infrastructure";
import { rolesConfig, rolePermissionsConfig } from './configs/roles.config';

/**
 * Service for seeding roles and permissions
 */
@Injectable()
export class RolesSeedService {
  private readonly logger = new Logger(RolesSeedService.name);

  constructor(
    private readonly rolePermissionRepository: RolePermissionRepository,
    private readonly userRoleRepository: UserRoleRepository,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * Seed role permissions
   */
  async seedRolePermissions(): Promise<void> {
    try {
      this.logger.log('Starting to seed role permissions...');

      // Clear existing permissions
      await this.rolePermissionRepository.deleteAll();
      this.logger.debug('Cleared existing permissions');

      // Create new permissions
      const allPermissions: RolePermissionCreatePayload[] = [];

      for (const roleConfig of rolePermissionsConfig) {
        for (const permission of roleConfig.permissions) {
          allPermissions.push({
            roleType: roleConfig.roleType,
            action: permission.action,
            subject: permission.subject,
            description: permission.description,
            isActive: true,
          });
        }
      }

      await this.rolePermissionRepository.createMany(allPermissions);

      this.logger.log(
        `Successfully seeded ${allPermissions.length} permissions for ${rolePermissionsConfig.length} roles`,
      );
    } catch (error) {
      this.logger.error('Failed to seed role permissions:', error);
      throw error;
    }
  }

  /**
   * Check if seeding is needed
   */
  async shouldRolePermissionsSeed(): Promise<boolean> {
    try {
      const existingPermissions = await this.rolePermissionRepository.count();
      return existingPermissions === 0;
    } catch (error) {
      this.logger.error('Failed to check if seeding is needed:', error);
      return true;
    }
  }

  /**
   * Check if roles need seeding
   */
  async shouldRoleSeedRoles(): Promise<boolean> {
    try {
      const rolesCount = await this.entityManager.count(UserRoleEntity, { loadEagerRelations: false });
      return rolesCount === 0;
    } catch (error) {
      this.logger.error('Failed to check if role seeding is needed:', error);
      return true;
    }
  }

  /**
   * Seed roles
   */
  async seedRoles(): Promise<void> {
    await this.entityManager.transaction(async (tran) => {
      const promises = rolesConfig.map((role) => tran.save(UserRoleEntity, role));
      await Promise.all(promises);
    });

    // Clear cache after creating roles
    await this.userRoleRepository.clearCache();
  }

  /**
   * Seed roles only if empty
   */
  async seedRolesIfEmpty(): Promise<void> {
    if (await this.shouldRoleSeedRoles()) {
      await this.seedRoles();
    }
  }

  /**
   * Seed permissions only if empty
   */
  async seedRolePermissionsIfEmpty(): Promise<void> {
    if (await this.shouldRolePermissionsSeed()) {
      await this.seedRolePermissions();
    }
  }
}
