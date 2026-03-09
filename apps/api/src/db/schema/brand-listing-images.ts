import {
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { brandListings } from './brand-listings';

export const brandListingImages = pgTable('brand_listing_images', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  listingId: integer('listing_id')
    .notNull()
    .references(() => brandListings.id),
  imageUrl: varchar('image_url', { length: 1024 }).notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
