import { DeepPartial } from 'typeorm';

import { RoleType } from '@/enums/role-type.enum';
import { Actions } from '@/enums/actions.enum';
import { Subjects } from '@/enums/subjects.enum';
import { UserRoleEntity } from '@/modules/users/infrastructure';

/**
 * Role permission interface
 */
interface RolePermission {
  action: Actions;
  subject: Subjects;
  description: string;
}

/**
 * Role configuration interface
 */
interface RoleConfig {
  roleType: RoleType;
  roleName: string;
  roleDescription: string;
  permissions: RolePermission[];
}

/**
 * Simplified roles configuration for boilerplate
 */
export const rolesConfig: DeepPartial<UserRoleEntity>[] = [
  { name: 'Administrator', description: 'System administrator', type: RoleType.ADMIN },
  { name: 'Moderator', description: 'Content moderator', type: RoleType.MODERATOR },
  { name: 'User', description: 'Regular user', type: RoleType.USER },
];

/**
 * Simplified role permissions configuration
 */
export const rolePermissionsConfig: RoleConfig[] = [
  {
    roleType: RoleType.ADMIN,
    roleName: 'Administrator',
    roleDescription: 'Full system access',
    permissions: [
      // User management
      { action: Actions.READ, subject: Subjects.USER_ADMIN, description: 'View users' },
      { action: Actions.CREATE, subject: Subjects.USER_ADMIN, description: 'Create users' },
      { action: Actions.UPDATE, subject: Subjects.USER_ADMIN, description: 'Update users' },
      { action: Actions.DELETE, subject: Subjects.USER_ADMIN, description: 'Delete users' },

      // Self management
      { action: Actions.UPDATE, subject: Subjects.USER, description: 'Update own data' },

      // Role management
      { action: Actions.READ, subject: Subjects.USER_ROLE, description: 'View roles' },
      { action: Actions.CREATE, subject: Subjects.USER_ROLE, description: 'Create roles' },
      { action: Actions.UPDATE, subject: Subjects.USER_ROLE, description: 'Update roles' },
      { action: Actions.DELETE, subject: Subjects.USER_ROLE, description: 'Delete roles' },

      // File management (admin)
      { action: Actions.READ, subject: Subjects.FILE_ADMIN, description: 'View all files' },
      { action: Actions.CREATE, subject: Subjects.FILE_ADMIN, description: 'Upload files' },
      { action: Actions.UPDATE, subject: Subjects.FILE_ADMIN, description: 'Update any file' },
      { action: Actions.DELETE, subject: Subjects.FILE_ADMIN, description: 'Delete any file' },

      // Own files
      { action: Actions.READ, subject: Subjects.FILE, description: 'View own files' },
      { action: Actions.CREATE, subject: Subjects.FILE, description: 'Upload own files' },
      { action: Actions.UPDATE, subject: Subjects.FILE, description: 'Update own files' },
      { action: Actions.DELETE, subject: Subjects.FILE, description: 'Delete own files' },

      // Notifications
      { action: Actions.READ, subject: Subjects.NOTIFICATION, description: 'View own notifications' },
      { action: Actions.UPDATE, subject: Subjects.NOTIFICATION, description: 'Update own notifications' },
      { action: Actions.DELETE, subject: Subjects.NOTIFICATION, description: 'Delete own notifications' },
    ],
  },

  {
    roleType: RoleType.MODERATOR,
    roleName: 'Moderator',
    roleDescription: 'Content management access',
    permissions: [
      // User view
      { action: Actions.READ, subject: Subjects.USER_ADMIN, description: 'View users' },
      { action: Actions.UPDATE, subject: Subjects.USER_ADMIN, description: 'Update users' },

      // Self management
      { action: Actions.UPDATE, subject: Subjects.USER, description: 'Update own data' },

      // Role view
      { action: Actions.READ, subject: Subjects.USER_ROLE, description: 'View roles' },

      // File management
      { action: Actions.READ, subject: Subjects.FILE, description: 'View files' },
      { action: Actions.CREATE, subject: Subjects.FILE, description: 'Upload files' },
      { action: Actions.UPDATE, subject: Subjects.FILE, description: 'Update files' },
      { action: Actions.DELETE, subject: Subjects.FILE, description: 'Delete files' },

      // Notifications
      { action: Actions.READ, subject: Subjects.NOTIFICATION, description: 'View own notifications' },
      { action: Actions.UPDATE, subject: Subjects.NOTIFICATION, description: 'Update own notifications' },
      { action: Actions.DELETE, subject: Subjects.NOTIFICATION, description: 'Delete own notifications' },
    ],
  },

  {
    roleType: RoleType.USER,
    roleName: 'User',
    roleDescription: 'Basic user access',
    permissions: [
      // Self management only
      { action: Actions.UPDATE, subject: Subjects.USER, description: 'Update own data' },

      // Role view
      { action: Actions.READ, subject: Subjects.USER_ROLE, description: 'View roles' },

      // File management (own files)
      { action: Actions.READ, subject: Subjects.FILE, description: 'View own files' },
      { action: Actions.CREATE, subject: Subjects.FILE, description: 'Upload files' },
      { action: Actions.UPDATE, subject: Subjects.FILE, description: 'Update own files' },
      { action: Actions.DELETE, subject: Subjects.FILE, description: 'Delete own files' },

      // Notifications
      { action: Actions.READ, subject: Subjects.NOTIFICATION, description: 'View own notifications' },
      { action: Actions.UPDATE, subject: Subjects.NOTIFICATION, description: 'Update own notifications' },
      { action: Actions.DELETE, subject: Subjects.NOTIFICATION, description: 'Delete own notifications' },
    ],
  },

  {
    roleType: RoleType.PUBLIC,
    roleName: 'Public',
    roleDescription: 'Unauthenticated access',
    permissions: [],
  },
];
