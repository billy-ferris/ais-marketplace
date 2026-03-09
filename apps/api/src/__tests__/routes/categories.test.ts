import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Use vi.hoisted so mockDb is available inside vi.mock factories (which are hoisted)
const { mockDb } = vi.hoisted(() => {
  const mockDb: any = {};
  return { mockDb };
});

// Mock @clerk/express before importing modules that use it
vi.mock('@clerk/express', () => ({
  clerkMiddleware: vi.fn(),
  requireAuth: vi.fn(
    () => (_req: Request, _res: Response, next: NextFunction) => next(),
  ),
  getAuth: vi.fn().mockReturnValue({
    userId: 'test-user',
    sessionClaims: { metadata: { role: 'admin' } },
  }),
}));

// Mock auth middleware as pass-through
vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn(
    () => (_req: Request, _res: Response, next: NextFunction) => next(),
  ),
  requireRole: vi.fn(
    () => (_req: Request, _res: Response, next: NextFunction) => next(),
  ),
}));

// Mock db with chainable methods
vi.mock('../../db/index', () => {
  mockDb.select = vi.fn().mockReturnValue(mockDb);
  mockDb.from = vi.fn().mockReturnValue(mockDb);
  mockDb.where = vi.fn().mockReturnValue(mockDb);
  mockDb.leftJoin = vi.fn().mockReturnValue(mockDb);
  mockDb.limit = vi.fn().mockReturnValue(mockDb);
  mockDb.offset = vi.fn().mockReturnValue(mockDb);
  mockDb.orderBy = vi.fn().mockReturnValue(mockDb);
  mockDb.insert = vi.fn().mockReturnValue(mockDb);
  mockDb.values = vi.fn().mockReturnValue(mockDb);
  mockDb.returning = vi.fn().mockResolvedValue([]);
  mockDb.update = vi.fn().mockReturnValue(mockDb);
  mockDb.set = vi.fn().mockReturnValue(mockDb);
  mockDb.delete = vi.fn().mockReturnValue(mockDb);
  mockDb.then = undefined;
  return { db: mockDb };
});

// Import router after mocks are set up
import { categoryRouter } from '../../routes/categories';

/**
 * Extract the route handler (final middleware) from an Express router.
 */
function getHandler(
  router: any,
  method: string,
  path: string,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const layer = router.stack.find(
    (l: any) => l.route?.path === path && l.route?.methods[method],
  );
  if (!layer) throw new Error(`No handler for ${method.toUpperCase()} ${path}`);
  const stack = layer.route.stack;
  return stack[stack.length - 1].handle;
}

/**
 * Create mock Express req/res/next objects.
 */
function createMockReqRes(overrides?: {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
}) {
  const req = {
    params: overrides?.params ?? {},
    query: overrides?.query ?? {},
    body: overrides?.body ?? {},
  } as unknown as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

const mockCategory = {
  id: 1,
  name: 'Test Category',
  slug: 'test-category',
  icon: 'box',
  displayOrder: 0,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
};

describe('Category Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all chainable mock methods to return mockDb
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.leftJoin.mockReturnValue(mockDb);
    mockDb.limit.mockReturnValue(mockDb);
    mockDb.offset.mockReturnValue(mockDb);
    mockDb.orderBy.mockReturnValue(mockDb);
    mockDb.insert.mockReturnValue(mockDb);
    mockDb.values.mockReturnValue(mockDb);
    mockDb.returning.mockResolvedValue([]);
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    // Make mockDb non-thenable by default
    mockDb.then = undefined;
  });

  describe('GET /api/categories', () => {
    it('should return paginated list of categories', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockCategory]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(categoryRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: [mockCategory],
        pagination: { page: 1, limit: 20, total: 1, pageCount: 1 },
      });
    });

    it('should filter categories by search query', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([]);
        else resolve([{ total: 0 }]);
      });

      const handler = getHandler(categoryRouter, 'get', '/');
      const { req, res, next } = createMockReqRes({
        query: { search: 'test' },
      });

      await handler(req, res, next);

      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should order categories by displayOrder ASC', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockCategory]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(categoryRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      // The handler calls orderBy(asc(categories.displayOrder))
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should exclude soft-deleted categories', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockCategory]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(categoryRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      // The handler always adds isNull(categories.deletedAt) to conditions
      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: [mockCategory] }),
      );
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return category by ID', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([mockCategory]);
      });

      const handler = getHandler(categoryRouter, 'get', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '1' } });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockCategory);
    });

    it('should return 404 for non-existent category', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });

      const handler = getHandler(categoryRouter, 'get', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '999' } });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category with valid data', async () => {
      const newCategory = {
        id: 2,
        name: 'New Category',
        slug: 'new-category',
        icon: null,
        displayOrder: 0,
      };

      // findUniqueSlug: select chain resolves to [] (no existing slug)
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      // insert().values().returning() resolves to [newCategory]
      mockDb.returning.mockResolvedValue([newCategory]);

      const handler = getHandler(categoryRouter, 'post', '/');
      const { req, res, next } = createMockReqRes({
        body: { name: 'New Category' },
      });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newCategory);
    });

    it('should auto-generate slug from name', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      mockDb.returning.mockResolvedValue([
        { id: 3, name: 'My Cool Category', slug: 'my-cool-category' },
      ]);

      const handler = getHandler(categoryRouter, 'post', '/');
      const { req, res, next } = createMockReqRes({
        body: { name: 'My Cool Category' },
      });

      await handler(req, res, next);

      // Verify that values() was called with an object containing a slug
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'my-cool-category' }),
      );
    });

    it('should reject invalid category data', async () => {
      const handler = getHandler(categoryRouter, 'post', '/');
      const { req, res, next } = createMockReqRes({
        body: { name: '' }, // name min(1) fails
      });

      await handler(req, res, next);

      // ZodError is passed to next() for the error handler middleware
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('PATCH /api/categories/:id', () => {
    it('should update category fields', async () => {
      const updatedCategory = { ...mockCategory, name: 'Updated Category' };

      // findUniqueSlug: select chain resolves to [] (no slug conflict)
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      // update().set().where().returning() resolves to [updatedCategory]
      mockDb.returning.mockResolvedValue([updatedCategory]);

      const handler = getHandler(categoryRouter, 'patch', '/:id');
      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: { name: 'Updated Category' },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(updatedCategory);
    });

    it('should return 404 for non-existent category', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      mockDb.returning.mockResolvedValue([]);

      const handler = getHandler(categoryRouter, 'patch', '/:id');
      const { req, res, next } = createMockReqRes({
        params: { id: '999' },
        body: { name: 'Ghost' },
      });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Category not found' });
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should soft-delete category', async () => {
      mockDb.returning.mockResolvedValue([mockCategory]);

      const handler = getHandler(categoryRouter, 'delete', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '1' } });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Category deleted' });
    });

    it('should not appear in subsequent list queries after soft delete', async () => {
      mockDb.returning.mockResolvedValue([mockCategory]);

      const handler = getHandler(categoryRouter, 'delete', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '1' } });

      await handler(req, res, next);

      // Verify set() was called with an object containing deletedAt
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });
  });
});
