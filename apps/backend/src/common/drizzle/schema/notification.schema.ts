import { pgTable, uuid, varchar, text, boolean, timestamp, index, uniqueIndex, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { user } from './users.schema';

// Enums
export const notificationTypeEnum = pgEnum('NotificationType', ['SYSTEM', 'INFO', 'WARNING', 'SUCCESS', 'ERROR']);

// notification_template table
export const notificationTemplate = pgTable(
  'notification_template',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
    name: varchar('name', { length: 100 }).notNull(),
    subject: varchar('subject', { length: 500 }).notNull(),
    content: text('content').notNull(),
    isActive: boolean('isActive').default(true),
  },
  (table) => [
    uniqueIndex('IDX_notification_template_name').on(table.name),
    index('IDX_notification_template_createdAt').on(table.createdAt),
    index('IDX_notification_template_updatedAt').on(table.updatedAt),
    index('IDX_notification_template_deletedAt').on(table.deletedAt),
  ],
);

// notification table
export const notification = pgTable(
  'notification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deletedAt', { withTimezone: true }),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    type: notificationTypeEnum('type').default('INFO'),
    isRead: boolean('isRead').default(false),
    metadata: jsonb('metadata'),
  },
  (table) => [
    index('IDX_notification_userId').on(table.userId),
    index('IDX_notification_isRead').on(table.isRead),
    index('IDX_notification_type').on(table.type),
    index('IDX_notification_createdAt').on(table.createdAt),
    index('IDX_notification_updatedAt').on(table.updatedAt),
    index('IDX_notification_deletedAt').on(table.deletedAt),
  ],
);
