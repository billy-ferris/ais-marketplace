import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { isNull } from 'drizzle-orm';
import { companies } from './companies';

export const brands = pgTable(
  'brands',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    description: text(),
    logoUrl: varchar('logo_url', { length: 1024 }),
    companyId: integer('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('brands_slug_active_unique')
      .on(table.slug)
      .where(isNull(table.deletedAt)),
  ],
);
