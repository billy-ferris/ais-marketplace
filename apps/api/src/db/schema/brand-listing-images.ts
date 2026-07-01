import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { brandListings } from './brand-listings';

export const brandListingImages = pgTable(
  'brand_listing_images',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    listingId: integer('listing_id')
      .notNull()
      .references(() => brandListings.id, { onDelete: 'cascade' }),
    imageUrl: varchar('image_url', { length: 1024 }).notNull(),
    displayOrder: integer('display_order').notNull().default(0),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('brand_listing_images_one_primary_per_listing')
      .on(table.listingId)
      .where(sql`${table.isPrimary} = true`),
  ],
);
