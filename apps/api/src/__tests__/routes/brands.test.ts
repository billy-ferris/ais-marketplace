import { describe, it, expect } from 'vitest';

describe('Brand Routes', () => {
  describe('GET /api/brands', () => {
    it.todo('should return paginated list of brands');
    it.todo('should filter brands by search query (ilike on name)');
    it.todo('should filter brands by companyId');
    it.todo('should exclude soft-deleted brands from list');
  });

  describe('GET /api/brands/:id', () => {
    it.todo('should return brand by ID with company relation');
    it.todo('should return 404 for non-existent brand');
    it.todo('should return 404 for soft-deleted brand');
  });

  describe('POST /api/brands', () => {
    it.todo('should create a new brand with valid data');
    it.todo('should auto-generate slug from name');
    it.todo('should reject invalid brand data (Zod validation)');
    it.todo('should require admin role');
  });

  describe('PATCH /api/brands/:id', () => {
    it.todo('should update brand fields');
    it.todo('should regenerate slug when name changes');
    it.todo('should return 404 for non-existent brand');
  });

  describe('DELETE /api/brands/:id', () => {
    it.todo('should soft-delete brand (set deletedAt)');
    it.todo('should return 404 for already-deleted brand');
    it.todo('should not appear in subsequent list queries after soft delete');
  });
});
