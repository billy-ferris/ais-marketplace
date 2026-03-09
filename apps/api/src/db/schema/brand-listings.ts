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
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
