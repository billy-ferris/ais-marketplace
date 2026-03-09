import {
  integer,
  pgTable,
  timestamp,
  varchar,
  text,
} from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const brands = pgTable('brands', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  logoUrl: varchar('logo_url', { length: 1024 }),
  companyId: integer('company_id')
    .notNull()
    .references(() => companies.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
