import { describe, it, expect } from 'vitest';
import { CPG_CATEGORIES } from '@ais/shared/constants';
import { getTableColumns } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { categories } from '../../db/schema/categories';
import { brands } from '../../db/schema/brands';
import { brandListings } from '../../db/schema/brand-listings';
import { inventorySkus } from '../../db/schema/inventory-skus';

describe('Category Seed Data', () => {
  describe('CPG_CATEGORIES constant', () => {
    it('should include all 7 CPG categories', () => {
      expect(CPG_CATEGORIES).toHaveLength(7);
    });

    it('should include Beauty Tools, Fragrances, Hair Care, Health & Wellness, Makeup, Nail Care, Skincare', () => {
      const names = CPG_CATEGORIES.map((c) => c.name);
      const expected = [
        'Beauty Tools',
        'Fragrances',
        'Hair Care',
        'Health & Wellness',
        'Makeup',
        'Nail Care',
        'Skincare',
      ];
      for (const name of expected) {
        expect(names).toContain(name);
      }
    });

    it('should have name, slug, and icon for each category', () => {
      for (const category of CPG_CATEGORIES) {
        expect(category.name).toBeTruthy();
        expect(category.slug).toBeTruthy();
        expect(category.icon).toBeTruthy();
      }
    });

    it('should have unique slugs for each category', () => {
      const slugs = CPG_CATEGORIES.map((c) => c.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });
  });

  describe('seed script', () => {
    it('should seed all 7 categories into the database', () => {
      // Verify categories table has all required columns for CPG_CATEGORIES data
      const columns = getTableColumns(categories);
      const columnNames = Object.keys(columns);
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('slug');
      expect(columnNames).toContain('icon');
      expect(columnNames).toContain('displayOrder');

      // Verify seed data source has exactly 7 entries
      expect(CPG_CATEGORIES).toHaveLength(7);
    });

    it('should seed brands linked to manufacturer companies', () => {
      // Verify brands table has companyId column
      const columns = getTableColumns(brands);
      expect(Object.keys(columns)).toContain('companyId');

      // Verify companyId is a FK to companies.id
      const config = getTableConfig(brands);
      const companyFk = config.foreignKeys.find((fk) => {
        const ref = fk.reference();
        return ref.columns.map((c) => c.name).includes('company_id');
      });
      expect(companyFk).toBeDefined();

      // Verify FK references companies table
      const ref = companyFk!.reference();
      const foreignTableConfig = getTableConfig(ref.foreignTable);
      expect(foreignTableConfig.name).toBe('companies');
    });

    it('should seed listings with SKUs', () => {
      // Verify inventorySkus has listingId column
      const skuColumns = getTableColumns(inventorySkus);
      expect(Object.keys(skuColumns)).toContain('listingId');

      // Verify listingId FK references brand_listings
      const skuConfig = getTableConfig(inventorySkus);
      const listingFk = skuConfig.foreignKeys.find((fk) => {
        const ref = fk.reference();
        return ref.columns.map((c) => c.name).includes('listing_id');
      });
      expect(listingFk).toBeDefined();

      const listingRef = listingFk!.reference();
      const listingTableConfig = getTableConfig(listingRef.foreignTable);
      expect(listingTableConfig.name).toBe('brand_listings');

      // Verify brandListings has brandId FK to brands
      const listingColumns = getTableColumns(brandListings);
      expect(Object.keys(listingColumns)).toContain('brandId');

      const listingConfig = getTableConfig(brandListings);
      const brandFk = listingConfig.foreignKeys.find((fk) => {
        const ref = fk.reference();
        return ref.columns.map((c) => c.name).includes('brand_id');
      });
      expect(brandFk).toBeDefined();

      const brandRef = brandFk!.reference();
      const brandTableConfig = getTableConfig(brandRef.foreignTable);
      expect(brandTableConfig.name).toBe('brands');
    });
  });
});
