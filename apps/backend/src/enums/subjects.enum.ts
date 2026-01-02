import { registerEnumType } from '@nestjs/graphql';

/**
 * Authorization subjects for CASL
 * Simplified to base subjects for boilerplate
 */
export enum Subjects {
  // User management subjects
  USER = 'User',
  USER_ADMIN = 'UserAdmin',
  USER_ROLE = 'UserRole',

  // File management subjects
  FILE = 'File',
  FILE_ADMIN = 'FileAdmin',

  // Notification subjects
  NOTIFICATION = 'Notification',

  // Authentication subjects
  IDENTITY = 'Identity',
  OAUTH = 'OAuth',
}

registerEnumType(Subjects, {
  name: 'Subjects',
  description: 'Authorization subjects',
  valuesMap: {
    USER: { description: 'Own user data' },
    USER_ADMIN: { description: 'User administration' },
    USER_ROLE: { description: 'Role management' },
    FILE: { description: 'Own file operations' },
    FILE_ADMIN: { description: 'File administration' },
    NOTIFICATION: { description: 'Own notifications' },
    IDENTITY: { description: 'OAuth identity management' },
    OAUTH: { description: 'OAuth provider operations' },
  },
});
