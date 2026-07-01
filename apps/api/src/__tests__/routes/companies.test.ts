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
    userId: 'clerk-admin',
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
  mockDb.insert = vi.fn().mockReturnValue(mockDb);
  mockDb.values = vi.fn().mockReturnValue(mockDb);
  mockDb.returning = vi.fn().mockResolvedValue([]);
  mockDb.update = vi.fn().mockReturnValue(mockDb);
  mockDb.set = vi.fn().mockReturnValue(mockDb);
  mockDb.then = undefined;
  return { db: mockDb };
});

// Import router after mocks are set up
import { companyRouter } from '../../routes/companies';
import { getCurrentUser, getCompanyUser } from '../../middleware/auth';

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

const SENSITIVE = ['marginPercentage', 'contactName', 'phone', 'street', 'zip'];
const RETAINED = ['name', 'type', 'city', 'state'];

const mockCompany = {
  id: 5,
  name: 'Acme Mfg',
  type: 'manufacturer',
  marginPercentage: '15.00',
  contactName: 'Jane Doe',
  phone: '555-1234',
  street: '1 Main St',
  city: 'Springfield',
  state: 'IL',
  zip: '62704',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

function setViewer(role: string, companyId: number) {
  (getCurrentUser as any).mockReturnValue({
    userId: 'clerk-viewer',
    role,
    sessionClaims: { metadata: { role } },
  });
  (getCompanyUser as any).mockResolvedValue({
    id: 1,
    companyId,
    role,
    email: 'viewer@test.com',
    firstName: 'Viewer',
  });
}

describe('Company Routes - field redaction (D-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.insert.mockReturnValue(mockDb);
    mockDb.values.mockReturnValue(mockDb);
    mockDb.returning.mockResolvedValue([]);
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.then = undefined;
    // default privileged admin viewer
    setViewer('admin', 1);
  });

  describe('GET /api/companies', () => {
    it('returns full rows (with marginPercentage) for an admin viewer', async () => {
      setViewer('admin', 999);
      mockDb.then = vi.fn((resolve: any) => resolve([mockCompany]));

      const handler = getHandler(companyRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      expect(payload[0]).toMatchObject({ marginPercentage: '15.00', contactName: 'Jane Doe' });
    });

    it('returns full rows for the owning-company viewer', async () => {
      setViewer('retailer', 5); // companyId matches company.id 5
      mockDb.then = vi.fn((resolve: any) => resolve([mockCompany]));

      const handler = getHandler(companyRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      expect(payload[0].marginPercentage).toBe('15.00');
    });

    it('redacts sensitive fields per-row for a non-admin, non-owner viewer', async () => {
      setViewer('retailer', 99); // companyId 99 != company.id 5
      mockDb.then = vi.fn((resolve: any) => resolve([mockCompany]));

      const handler = getHandler(companyRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      const row = payload[0];
      for (const key of SENSITIVE) {
        expect(row).not.toHaveProperty(key);
      }
      for (const key of RETAINED) {
        expect(row).toHaveProperty(key);
      }
    });
  });

  describe('GET /api/companies/:id', () => {
    it('returns the full row for an admin viewer', async () => {
      setViewer('admin', 999);
      mockDb.then = vi.fn((resolve: any) => resolve([mockCompany]));

      const handler = getHandler(companyRouter, 'get', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '5' } });

      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      expect(payload).toMatchObject({ marginPercentage: '15.00', phone: '555-1234' });
    });

    it('redacts sensitive fields for a non-admin, non-owner viewer', async () => {
      setViewer('retailer', 99);
      mockDb.then = vi.fn((resolve: any) => resolve([mockCompany]));

      const handler = getHandler(companyRouter, 'get', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '5' } });

      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      for (const key of SENSITIVE) {
        expect(payload).not.toHaveProperty(key);
      }
      for (const key of RETAINED) {
        expect(payload).toHaveProperty(key);
      }
    });

    it('returns 404 for a non-existent id', async () => {
      setViewer('admin', 1);
      mockDb.then = vi.fn((resolve: any) => resolve([]));

      const handler = getHandler(companyRouter, 'get', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: '999' } });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Company not found' });
    });

    it('returns 400 for an invalid (non-numeric) id', async () => {
      const handler = getHandler(companyRouter, 'get', '/:id');
      const { req, res, next } = createMockReqRes({ params: { id: 'abc' } });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid company ID' });
    });
  });
});
