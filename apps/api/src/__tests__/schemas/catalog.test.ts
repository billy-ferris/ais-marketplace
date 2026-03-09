import { describe, it, expect } from 'vitest';

describe('Catalog Zod Schemas', () => {
  describe('createBrandSchema', () => {
    it.todo('should accept valid brand input');
    it.todo('should reject empty name');
    it.todo('should reject name longer than 255 characters');
    it.todo('should reject invalid logoUrl (not a URL)');
    it.todo('should require companyId as positive integer');
  });

  describe('createCategorySchema', () => {
    it.todo('should accept valid category input');
    it.todo('should reject empty name');
    it.todo('should accept optional icon and displayOrder');
  });

  describe('createListingSchema', () => {
    it.todo('should accept valid listing input');
    it.todo('should reject empty name');
    it.todo('should default status to draft');
    it.todo('should require brandId as positive integer');
    it.todo('should accept optional categoryIds array');
  });

  describe('createSkuSchema', () => {
    it.todo('should accept valid SKU input');
    it.todo('should reject empty name');
    it.todo('should require price as decimal string');
    it.todo('should require quantity as non-negative integer');
    it.todo('should require msrp as decimal string');
    it.todo('should accept optional sku, upc, size, casePack, casesPerPallet, imageUrl');
  });

  describe('updateBrandSchema', () => {
    it.todo('should make all fields optional (partial of create)');
  });

  describe('updateListingSchema', () => {
    it.todo('should make all fields optional (partial of create)');
  });
});
