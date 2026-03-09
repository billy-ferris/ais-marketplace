import { describe, it, expect } from 'vitest';

describe('Category Routes', () => {
  describe('GET /api/categories', () => {
    it.todo('should return paginated list of categories');
    it.todo('should filter categories by search query');
    it.todo('should order categories by displayOrder ASC');
    it.todo('should exclude soft-deleted categories');
  });

  describe('GET /api/categories/:id', () => {
    it.todo('should return category by ID');
    it.todo('should return 404 for non-existent category');
  });

  describe('POST /api/categories', () => {
    it.todo('should create a new category with valid data');
    it.todo('should auto-generate slug from name');
    it.todo('should reject invalid category data');
  });

  describe('PATCH /api/categories/:id', () => {
    it.todo('should update category fields');
    it.todo('should return 404 for non-existent category');
  });

  describe('DELETE /api/categories/:id', () => {
    it.todo('should soft-delete category');
    it.todo('should not appear in subsequent list queries after soft delete');
  });
});
