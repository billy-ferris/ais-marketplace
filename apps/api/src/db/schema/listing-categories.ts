import {
  integer,
  pgTable,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { brandListings } from './brand-listings';
import { categories } from './categories';

export const listingCategories = pgTable(
  'listing_categories',
  {
    listingId: integer('listing_id')
      .notNull()
      .references(() => brandListings.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
  },
  (table) => [
    primaryKey({ columns: [table.listingId, table.categoryId] }),
  ],
);
