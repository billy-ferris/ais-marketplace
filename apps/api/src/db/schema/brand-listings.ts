import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
  text,
} from 'drizzle-orm/pg-core';
import { brands } from './brands';

export const listingStatusEnum = pgEnum('listing_status', [
  'draft',
  'active',
  'sold_out',
  'archived',
  'pending_approval',
  'rejected',
]);

export const brandListings = pgTable('brand_listings', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  brandId: integer('brand_id')
    .notNull()
    .references(() => brands.id),
  status: listingStatusEnum().notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  rejectionReason: varchar('rejection_reason', { length: 1000 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
