import { describe, it, expect } from 'vitest';
import {
  createBrandSchema,
  updateBrandSchema,
  createCategorySchema,
  createListingSchema,
  updateListingSchema,
  createSkuSchema,
} from '@ais/shared/schemas';
import { ListingStatus, LISTING_STATUS_LABELS } from '@ais/shared/types';

describe('Catalog Zod Schemas', () => {
  describe('createBrandSchema', () => {
    it('should accept valid brand input', () => {
      const result = createBrandSchema.safeParse({ name: 'Test Brand', companyId: 1 });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createBrandSchema.safeParse({ name: '', companyId: 1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0]);
        expect(paths).toContain('name');
      }
    });

    it('should reject name longer than 255 characters', () => {
      const result = createBrandSchema.safeParse({ name: 'a'.repeat(256), companyId: 1 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid logoUrl (not a URL)', () => {
      const result = createBrandSchema.safeParse({ name: 'Brand', companyId: 1, logoUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('should require companyId as positive integer', () => {
      const negative = createBrandSchema.safeParse({ name: 'Brand', companyId: -1 });
      expect(negative.success).toBe(false);

      const missing = createBrandSchema.safeParse({ name: 'Brand' });
      expect(missing.success).toBe(false);
    });
  });

  describe('createCategorySchema', () => {
    it('should accept valid category input', () => {
      const result = createCategorySchema.safeParse({ name: 'Test Category' });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createCategorySchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should accept optional icon and displayOrder', () => {
      const withOptionals = createCategorySchema.safeParse({ name: 'Cat', icon: 'star', displayOrder: 0 });
      expect(withOptionals.success).toBe(true);

      const withoutOptionals = createCategorySchema.safeParse({ name: 'Cat' });
      expect(withoutOptionals.success).toBe(true);
    });
  });

  describe('createListingSchema', () => {
    it('should accept valid listing input', () => {
      const result = createListingSchema.safeParse({ name: 'Test Listing', brandId: 1 });
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createListingSchema.safeParse({ name: '', brandId: 1 });
      expect(result.success).toBe(false);
    });

    it('should default status to draft', () => {
      const result = createListingSchema.parse({ name: 'Listing', brandId: 1 });
      expect(result.status).toBe('draft');
    });

    it('should require brandId as positive integer', () => {
      const negative = createListingSchema.safeParse({ name: 'Listing', brandId: -1 });
      expect(negative.success).toBe(false);

      const missing = createListingSchema.safeParse({ name: 'Listing' });
      expect(missing.success).toBe(false);
    });

    it('should accept optional categoryIds array', () => {
      const withIds = createListingSchema.safeParse({ name: 'Listing', brandId: 1, categoryIds: [1, 2, 3] });
      expect(withIds.success).toBe(true);

      const withoutIds = createListingSchema.safeParse({ name: 'Listing', brandId: 1 });
      expect(withoutIds.success).toBe(true);
    });
  });

  describe('createSkuSchema', () => {
    const validSku = { name: 'SKU 1', price: '12.99', msrp: '24.99', quantity: 10 };

    it('should accept valid SKU input', () => {
      const result = createSkuSchema.safeParse(validSku);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createSkuSchema.safeParse({ ...validSku, name: '' });
      expect(result.success).toBe(false);
    });

    it('should require price as decimal string', () => {
      const numberPrice = createSkuSchema.safeParse({ ...validSku, price: 12.99 });
      expect(numberPrice.success).toBe(false);

      const invalidString = createSkuSchema.safeParse({ ...validSku, price: 'abc' });
      expect(invalidString.success).toBe(false);

      const validString = createSkuSchema.safeParse({ ...validSku, price: '12.99' });
      expect(validString.success).toBe(true);
    });

    it('should require quantity as non-negative integer', () => {
      const negative = createSkuSchema.safeParse({ ...validSku, quantity: -1 });
      expect(negative.success).toBe(false);

      const zero = createSkuSchema.safeParse({ ...validSku, quantity: 0 });
      expect(zero.success).toBe(true);
    });

    it('should require msrp as decimal string', () => {
      const invalidMsrp = createSkuSchema.safeParse({ ...validSku, msrp: 'abc' });
      expect(invalidMsrp.success).toBe(false);

      const validMsrp = createSkuSchema.safeParse({ ...validSku, msrp: '24.99' });
      expect(validMsrp.success).toBe(true);
    });

    it('should accept optional sku, upc, size, casePack, casesPerPallet, imageUrl', () => {
      const withAll = createSkuSchema.safeParse({
        ...validSku,
        sku: 'ABC-123',
        upc: '012345678901',
        size: '16oz',
        casePack: 12,
        casesPerPallet: 60,
        imageUrl: 'https://example.com/image.jpg',
      });
      expect(withAll.success).toBe(true);

      const withNone = createSkuSchema.safeParse(validSku);
      expect(withNone.success).toBe(true);
    });
  });

  describe('updateBrandSchema', () => {
    it('should make all fields optional (partial of create)', () => {
      const empty = updateBrandSchema.safeParse({});
      expect(empty.success).toBe(true);

      const partial = updateBrandSchema.safeParse({ name: 'Updated' });
      expect(partial.success).toBe(true);
    });
  });

  describe('updateListingSchema', () => {
    it('should make all fields optional (partial of create)', () => {
      const empty = updateListingSchema.safeParse({});
      expect(empty.success).toBe(true);

      const partial = updateListingSchema.safeParse({ name: 'Updated' });
      expect(partial.success).toBe(true);
    });
  });

  describe('ListingStatus enum', () => {
    it('should include pending_approval status', () => {
      expect(ListingStatus.PENDING_APPROVAL).toBe('pending_approval');
    });

    it('should include rejected status', () => {
      expect(ListingStatus.REJECTED).toBe('rejected');
    });

    it('should have labels for all status values including pending_approval and rejected', () => {
      const allStatuses = Object.values(ListingStatus);
      for (const status of allStatuses) {
        expect(LISTING_STATUS_LABELS[status]).toBeDefined();
        expect(typeof LISTING_STATUS_LABELS[status]).toBe('string');
      }
      expect(LISTING_STATUS_LABELS[ListingStatus.PENDING_APPROVAL]).toBe('Pending Approval');
      expect(LISTING_STATUS_LABELS[ListingStatus.REJECTED]).toBe('Rejected');
    });
  });
});
