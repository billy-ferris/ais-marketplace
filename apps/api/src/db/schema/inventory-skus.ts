import {
  integer,
  numeric,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { brandListings } from './brand-listings';

export const inventorySkus = pgTable('inventory_skus', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  listingId: integer('listing_id')
    .notNull()
    .references(() => brandListings.id),
  name: varchar({ length: 255 }).notNull(),
  sku: varchar({ length: 100 }),
  upc: varchar({ length: 20 }),
  size: varchar({ length: 100 }),
  casePack: integer('case_pack'),
  casesPerPallet: integer('cases_per_pallet'),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  msrp: numeric({ precision: 10, scale: 2 }).notNull(),
  quantity: integer().notNull().default(0),
  imageUrl: varchar('image_url', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
