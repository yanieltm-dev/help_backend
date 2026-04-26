import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const mediaFile = pgTable('media_file', {
  id: text('id').primaryKey(),
  key: text('key').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  ownerId: text('owner_id').notNull(),
  publicUrl: text('public_url').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
