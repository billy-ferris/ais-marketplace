import { describe, it, expect } from 'vitest';

describe('Listing Routes', () => {
  describe('GET /api/listings', () => {
    it.todo('should return paginated list of listings');
    it.todo('should filter by search query');
    it.todo('should filter by status');
    it.todo('should filter by brandId');
    it.todo('should include brand name, SKU count, and categories in response');
    it.todo('should exclude soft-deleted listings');
  });

  describe('GET /api/listings/:id', () => {
    it.todo('should return full listing with brand, SKUs, images, and categories');
    it.todo('should return 404 for non-existent listing');
    it.todo('should exclude soft-deleted SKUs from nested response');
  });

  describe('POST /api/listings', () => {
    it.todo('should create listing with nested SKUs, images, and categories');
    it.todo('should enforce max 5 images per listing');
    it.todo('should set exactly one image as primary');
    it.todo('should reject invalid listing data');
  });

  describe('PATCH /api/listings/:id', () => {
    it.todo('should update listing fields');
    it.todo('should create new SKUs via skus.create');
    it.todo('should update existing SKUs via skus.update');
    it.todo('should soft-delete SKUs via skus.delete');
    it.todo('should replace categories via categoryIds');
    it.todo('should add and delete images');
  });

  describe('DELETE /api/listings/:id', () => {
    it.todo('should soft-delete listing and cascade soft-delete to SKUs');
    it.todo('should hard-delete listing_categories join rows');
    it.todo('should hard-delete brand_listing_images rows');
  });
});
