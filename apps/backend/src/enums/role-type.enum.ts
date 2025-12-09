import { registerEnumType } from '@nestjs/graphql';

/**
 * Role types for authorization
 * Simplified to 4 base roles
 */
export enum RoleType {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  PUBLIC = 'public',
}

/**
 * Human-readable display names for roles
 */
export const ROLE_TYPE_DISPLAY_NAMES: Record<RoleType, string> = {
  [RoleType.ADMIN]: 'Administrator',
  [RoleType.MODERATOR]: 'Moderator',
  [RoleType.USER]: 'User',
  [RoleType.PUBLIC]: 'Public',
};

/**
 * Roles allowed for registration
 */
export const REGISTRATION_ALLOWED_ROLES: RoleType[] = [RoleType.USER];

registerEnumType(RoleType, {
  name: 'RoleType',
  description: 'User role types',
  valuesMap: {
    ADMIN: { description: 'System administrator with full access' },
    MODERATOR: { description: 'Content moderator with limited admin access' },
    USER: { description: 'Regular authenticated user' },
    PUBLIC: { description: 'Public/unauthenticated access' },
  },
});
