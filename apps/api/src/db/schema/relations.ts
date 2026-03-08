import { relations } from 'drizzle-orm';
import { users } from './users.js';
import { companies } from './companies.js';

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}));
