import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { companies } from './companies.js';

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'manufacturer',
  'retailer',
]);

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: userRoleEnum().notNull().default('retailer'),
  companyId: integer('company_id').references(() => companies.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
