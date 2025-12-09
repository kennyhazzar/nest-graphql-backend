import { UserRoleEntity } from '../../infrastructure/entity';

/**
 * Domain UserRole entity with business logic
 */
export class UserRole extends UserRoleEntity {
  /**
   * Factory method to create a new role
   */
  static create(data: Partial<UserRoleEntity>): UserRole {
    const role = new UserRole();
    Object.assign(role, data);
    return role;
  }
}

/**
 * Roles aggregate
 */
export class Roles extends Array<UserRole> {
  totalCount: number = 0;

  static create(roles: UserRole[], totalCount?: number): Roles {
    const aggregate = new Roles();
    aggregate.push(...roles);
    aggregate.totalCount = totalCount ?? roles.length;
    return aggregate;
  }
}
