import {
  pgTable,
  uuid,
  varchar,
  boolean,
  text,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';

// Enums
export const roleTypeEnum = pgEnum('RoleType', ['admin', 'moderator', 'user', 'public']);
export const actionsEnum = pgEnum('Actions', ['create', 'read', 'update', 'delete']);
export const subjectsEnum = pgEnum('Subjects', [
  'User',
  'UserAdmin',
  'UserRole',
  'File',
  'FileAdmin',
  'Notification',
  'Identity',
  'OAuth',
]);
export const genderEnum = pgEnum('Gender', ['male', 'female']);
export const themeEnum = pgEnum('Theme', ['light', 'dark', 'auto', 'system']);
export const oAuthProviderTypeEnum = pgEnum('OAuthProviderType', ['google', 'yandex']);

// user_role table
export const userRole = pgTable(
  'user_role',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: varchar('description', { length: 255 }).default(''),
    type: roleTypeEnum('type').notNull().default('user'),
  },
  (table) => [
    index('idx_user_role_type').on(table.type),
    index('IDX_user_role_createdAt').on(table.createdAt),
    index('IDX_user_role_updatedAt').on(table.updatedAt),
    index('IDX_user_role_deletedAt').on(table.deletedAt),
  ],
);

// user table
export const user = pgTable(
  'user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
    email: varchar('email', { length: 100 }).notNull(),
    forgotConfirmKey: varchar('forgotConfirmKey'),
    emailConfirmKey: varchar('emailConfirmKey'),
    verified: boolean('verified').default(false),
    password: varchar('password', { length: 255 }),
    name: varchar('name', { length: 100 }).notNull(),
    surname: varchar('surname', { length: 100 }).notNull(),
    middleName: varchar('middleName', { length: 100 }),
    phone: varchar('phone', { length: 20 }),
    roleId: uuid('roleId')
      .notNull()
      .references(() => userRole.id, { onDelete: 'set null' }),
    gender: genderEnum('gender').default('male'),
    birthday: timestamp('birthday', { withTimezone: true }),
    blocked: boolean('blocked').default(false),
    country: varchar('country', { length: 2 }).default('RU'),
    language: varchar('language', { length: 6 }).default('ru'),
    locale: varchar('locale', { length: 6 }).default('ru_RU'),
    theme: themeEnum('theme').default('light'),
  },
  (table) => [
    uniqueIndex('uniq_user_email').on(table.email),
    index('IDX_user_createdAt').on(table.createdAt),
    index('IDX_user_updatedAt').on(table.updatedAt),
    index('IDX_user_deletedAt').on(table.deletedAt),
  ],
);

// role_permission table
export const rolePermission = pgTable(
  'role_permission',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
    roleType: roleTypeEnum('roleType').notNull(),
    action: actionsEnum('action').notNull(),
    subject: subjectsEnum('subject').notNull(),
    description: varchar('description', { length: 255 }),
    isActive: boolean('isActive').default(true),
  },
  (table) => [
    index('isactive_role_idx').on(table.isActive, table.roleType),
    index('isactive_role_permission_idx').on(table.isActive, table.roleType, table.action, table.subject),
    index('IDX_role_permission_createdAt').on(table.createdAt),
    index('IDX_role_permission_updatedAt').on(table.updatedAt),
    index('IDX_role_permission_deletedAt').on(table.deletedAt),
  ],
);

// refresh table
export const refresh = pgTable(
  'refresh',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    refreshToken: text('refreshToken').notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    isRevoked: boolean('isRevoked').notNull(),
    fingerprint: text('fingerprint').notNull(),
    userAgent: text('userAgent').notNull(),
  },
  (table) => [
    index('IDX_refresh_createdAt').on(table.createdAt),
    index('IDX_refresh_updatedAt').on(table.updatedAt),
    index('IDX_refresh_deletedAt').on(table.deletedAt),
  ],
);

// magic_link_token table
export const magicLinkToken = pgTable(
  'magic_link_token',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
    email: varchar('email', { length: 255 }).notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    isUsed: boolean('isUsed').default(false),
    fingerprint: text('fingerprint').notNull(),
    userAgent: text('userAgent').notNull(),
  },
  (table) => [
    index('IDX_magic_link_token_email').on(table.email),
    index('IDX_magic_link_token_expires').on(table.expiresAt),
    uniqueIndex('IDX_magic_link_token_token').on(table.token),
    index('IDX_magic_link_token_createdAt').on(table.createdAt),
    index('IDX_magic_link_token_updatedAt').on(table.updatedAt),
    index('IDX_magic_link_token_deletedAt').on(table.deletedAt),
  ],
);

// identity table
export const identity = pgTable(
  'identity',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    providerType: oAuthProviderTypeEnum('providerType').notNull(),
    providerUserId: varchar('providerUserId', { length: 255 }).notNull(),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    tokenExpiresAt: timestamp('tokenExpiresAt', { withTimezone: true }),
    providerEmail: varchar('providerEmail', { length: 255 }),
    avatarUrl: text('avatarUrl'),
    metadata: jsonb('metadata'),
  },
  (table) => [
    uniqueIndex('UQ_identity_user_provider').on(table.userId, table.providerType),
    index('IDX_identity_provider_userid').on(table.providerType, table.providerUserId),
    index('IDX_identity_createdAt').on(table.createdAt),
    index('IDX_identity_updatedAt').on(table.updatedAt),
    index('IDX_identity_deletedAt').on(table.deletedAt),
  ],
);
