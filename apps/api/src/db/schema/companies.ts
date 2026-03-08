import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const companyTypeEnum = pgEnum('company_type', [
  'manufacturer',
  'retailer',
]);

export const companies = pgTable('companies', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  type: companyTypeEnum().notNull(),
  marginPercentage: numeric('margin_percentage', {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default('10.00'),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  phone: varchar({ length: 20 }).notNull(),
  street: varchar({ length: 255 }),
  city: varchar({ length: 100 }),
  state: varchar({ length: 2 }),
  zip: varchar({ length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
