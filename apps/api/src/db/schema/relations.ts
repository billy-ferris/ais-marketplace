import { relations } from 'drizzle-orm';
import { users } from './users';
import { companies } from './companies';

export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}));
