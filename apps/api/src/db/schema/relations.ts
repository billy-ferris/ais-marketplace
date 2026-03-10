import { relations } from 'drizzle-orm';
import { users } from './users';
import { companies } from './companies';
import { brands } from './brands';
import { brandListings } from './brand-listings';
import { inventorySkus } from './inventory-skus';
import { categories } from './categories';
import { listingCategories } from './listing-categories';
import { brandListingImages } from './brand-listing-images';
import { notifications } from './notifications';

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  notifications: many(notifications),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  brands: many(brands),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  company: one(companies, {
    fields: [brands.companyId],
    references: [companies.id],
  }),
  brandListings: many(brandListings),
}));

export const brandListingsRelations = relations(
  brandListings,
  ({ one, many }) => ({
    brand: one(brands, {
      fields: [brandListings.brandId],
      references: [brands.id],
    }),
    inventorySkus: many(inventorySkus),
    brandListingImages: many(brandListingImages),
    listingCategories: many(listingCategories),
  }),
);

export const inventorySkusRelations = relations(inventorySkus, ({ one }) => ({
  brandListing: one(brandListings, {
    fields: [inventorySkus.listingId],
    references: [brandListings.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  listingCategories: many(listingCategories),
}));

export const listingCategoriesRelations = relations(
  listingCategories,
  ({ one }) => ({
    brandListing: one(brandListings, {
      fields: [listingCategories.listingId],
      references: [brandListings.id],
    }),
    category: one(categories, {
      fields: [listingCategories.categoryId],
      references: [categories.id],
    }),
  }),
);

export const brandListingImagesRelations = relations(
  brandListingImages,
  ({ one }) => ({
    brandListing: one(brandListings, {
      fields: [brandListingImages.listingId],
      references: [brandListings.id],
    }),
  }),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
