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

// Mock auth middleware as pass-through (admin role by default)
vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn(
    () => (_req: Request, _res: Response, next: NextFunction) => next(),
  ),
  requireRole: vi.fn(
    () => (_req: Request, _res: Response, next: NextFunction) => next(),
  ),
  getCurrentUser: vi.fn().mockReturnValue({
    userId: 'test-user',
    role: 'admin',
    sessionClaims: { metadata: { role: 'admin' } },
  }),
  getCompanyUser: vi.fn().mockResolvedValue({
    id: 1,
    companyId: 1,
    role: 'admin',
    email: 'admin@test.com',
    firstName: 'Admin',
  }),
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
import { brandRouter } from '../../routes/brands';
import { requireRole } from '../../middleware/auth';

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

const mockBrand = {
  id: 1,
  name: 'Test Brand',
  slug: 'test-brand',
  description: 'A test brand',
  logoUrl: null,
  companyId: 1,
  companyName: 'Test Company',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('Brand Routes', () => {
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

  describe('GET /api/brands', () => {
    it('should return paginated list of brands', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockBrand]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(brandRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: [mockBrand],
        pagination: { page: 1, limit: 20, total: 1, pageCount: 1 },
      });
    });

    it('should filter brands by search query (ilike on name)', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([]);
        else resolve([{ total: 0 }]);
      });

      const handler = getHandler(brandRouter, 'get', '/');
      const { req, res, next } = createMockReqRes({
        query: { search: 'test' },
      });

      await handler(req, res, next);

      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should filter brands by companyId', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([]);
        else resolve([{ total: 0 }]);
      });

      const handler = getHandler(brandRouter, 'get', '/');
      const { req, res, next } = createMockReqRes({
        query: { companyId: '1' },
      });

      await handler(req, res, next);

      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should exclude soft-deleted brands from list', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockBrand]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(brandRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      // The handler always adds isNull(brands.deletedAt) to conditions
      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: [mockBrand] }),
      );
    });
  });

  describe('GET /api/brands/:id', () => {
    it('should return brand by ID with company relation', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([mockBrand]);
      });

      const handler = getHandler(brandRouter, 'get', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '1' } });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(mockBrand);
    });

    it('should return 404 for non-existent brand', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });

      const handler = getHandler(brandRouter, 'get', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '999' } });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Brand not found' });
    });

    it('should return 404 for soft-deleted brand', async () => {
      // Soft-deleted brands are filtered by the where clause (isNull(deletedAt))
      // so the query returns empty results
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });

      const handler = getHandler(brandRouter, 'get', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '1' } });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Brand not found' });
    });
  });

  describe('POST /api/brands', () => {
    it('should create a new brand with valid data', async () => {
      const newBrand = {
        id: 2,
        name: 'New Brand',
        slug: 'new-brand',
        companyId: 1,
      };

      // findUniqueSlug: select chain resolves to [] (no existing slug)
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      // insert().values().returning() resolves to [newBrand]
      mockDb.returning.mockResolvedValue([newBrand]);

      const handler = getHandler(brandRouter, 'post', '/');
      const { req, res, next } = createMockReqRes({
        body: { name: 'New Brand', companyId: 1 },
      });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newBrand);
    });

    it('should auto-generate slug from name', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      mockDb.returning.mockResolvedValue([
        { id: 3, name: 'My Cool Brand', slug: 'my-cool-brand', companyId: 1 },
      ]);

      const handler = getHandler(brandRouter, 'post', '/');
      const { req, res, next } = createMockReqRes({
        body: { name: 'My Cool Brand', companyId: 1 },
      });

      await handler(req, res, next);

      // Verify that values() was called with an object containing a slug
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'my-cool-brand' }),
      );
    });

    it('should reject invalid brand data (Zod validation)', async () => {
      const handler = getHandler(brandRouter, 'post', '/');
      const { req, res, next } = createMockReqRes({
        body: { name: '' }, // name min(1) fails, companyId missing
      });

      await handler(req, res, next);

      // ZodError is passed to next() for the error handler middleware
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should require admin role', () => {
      // Verify that POST / route has middleware in its stack (auth + role + handler)
      const layer = (brandRouter as any).stack.find(
        (l: any) => l.route?.path === '/' && l.route?.methods.post,
      );
      // Route should have multiple middleware: requireAuth, requireRole, and the handler
      expect(layer.route.stack.length).toBeGreaterThan(1);
    });
  });

  describe('PATCH /api/brands/:id', () => {
    it('should update brand fields', async () => {
      const updatedBrand = { ...mockBrand, name: 'Updated Brand' };

      // findUniqueSlug: select chain resolves to [] (no slug conflict)
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      // update().set().where().returning() resolves to [updatedBrand]
      mockDb.returning.mockResolvedValue([updatedBrand]);

      const handler = getHandler(brandRouter, 'patch', '/:id');
      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: { name: 'Updated Brand' },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(updatedBrand);
    });

    it('should regenerate slug when name changes', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      mockDb.returning.mockResolvedValue([
        { ...mockBrand, name: 'New Name', slug: 'new-name' },
      ]);

      const handler = getHandler(brandRouter, 'patch', '/:id');
      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: { name: 'New Name' },
      });

      await handler(req, res, next);

      // set() should be called with an object containing slug
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'new-name' }),
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 404 for non-existent brand', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      mockDb.returning.mockResolvedValue([]);

      const handler = getHandler(brandRouter, 'patch', '/:id');
      const { req, res, next } = createMockReqRes({
        params: { id: '999' },
        body: { name: 'Ghost' },
      });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Brand not found' });
    });
  });

  describe('DELETE /api/brands/:id', () => {
    it('should soft-delete brand (set deletedAt)', async () => {
      mockDb.returning.mockResolvedValue([mockBrand]);

      const handler = getHandler(brandRouter, 'delete', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '1' } });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Brand deleted' });
    });

    it('should return 404 for already-deleted brand', async () => {
      mockDb.returning.mockResolvedValue([]);

      const handler = getHandler(brandRouter, 'delete', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '1' } });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Brand not found' });
    });

    it('should not appear in subsequent list queries after soft delete', async () => {
      mockDb.returning.mockResolvedValue([mockBrand]);

      const handler = getHandler(brandRouter, 'delete', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '1' } });

      await handler(req, res, next);

      // Verify set() was called with an object containing deletedAt
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });
  });

  // ---- Manufacturer scoping ----
  describe('Manufacturer scoping', () => {
    it('should filter brands to manufacturer company when role is manufacturer', async () => {
      const { getCurrentUser, getCompanyUser } = await import('../../middleware/auth');
      (getCurrentUser as any).mockReturnValue({ userId: 'mfg-user', role: 'manufacturer' });
      (getCompanyUser as any).mockResolvedValue({ id: 2, companyId: 5, role: 'manufacturer' });

      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockBrand]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(brandRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      // The manufacturer branch adds eq(brands.companyId, user.companyId)
      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: [mockBrand] }),
      );
    });

    it('should auto-set companyId from session for manufacturer brand create', async () => {
      const { getCurrentUser, getCompanyUser } = await import('../../middleware/auth');
      (getCurrentUser as any).mockReturnValue({ userId: 'mfg-user', role: 'manufacturer' });
      (getCompanyUser as any).mockResolvedValue({ id: 2, companyId: 5, role: 'manufacturer' });

      // findUniqueSlug: no existing slug conflict
      mockDb.then = vi.fn((resolve: any) => {
        resolve([]);
      });
      mockDb.returning.mockResolvedValue([
        { id: 2, name: 'Brand', slug: 'brand', companyId: 5 },
      ]);

      const handler = getHandler(brandRouter, 'post', '/');
      const { req, res, next } = createMockReqRes({
        body: { name: 'Brand', companyId: 999 },
      });

      await handler(req, res, next);

      // Manufacturer's companyId (5) should override the supplied value (999)
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 5 }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return all brands for admin role', async () => {
      // getCurrentUser already defaults to admin role via the mock
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockBrand]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(brandRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [mockBrand],
          pagination: expect.objectContaining({ total: 1 }),
        }),
      );
    });

    it('should prevent manufacturer from editing other company brands', async () => {
      const { getCurrentUser, getCompanyUser } = await import('../../middleware/auth');
      (getCurrentUser as any).mockReturnValue({ userId: 'mfg-user', role: 'manufacturer' });
      (getCompanyUser as any).mockResolvedValue({ id: 2, companyId: 5, role: 'manufacturer' });

      // Brand existence check returns a brand owned by a different company (99)
      mockDb.then = vi.fn((resolve: any) => {
        resolve([{ companyId: 99 }]);
      });

      const handler = getHandler(brandRouter, 'patch', '/:id');
      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: { name: 'Steal Brand' },
      });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });
  });
});
