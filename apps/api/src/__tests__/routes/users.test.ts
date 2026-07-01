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

// Mock db with query API (users.ts uses db.query.users.findFirst)
vi.mock('../../db/index', () => {
  mockDb.query = {
    users: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  return { db: mockDb };
});

// Import router after mocks are set up
import { userRouter } from '../../routes/users';
import { getCurrentUser } from '../../middleware/auth';

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

const mockUser = {
  id: 42,
  clerkId: 'clerk-self',
  email: 'self@test.com',
  firstName: 'Self',
  lastName: 'User',
  role: 'manufacturer',
  companyId: 5,
  company: { id: 5, name: 'Self Co' },
};

describe('User Routes - GET /:id (self-or-admin deny-by-404)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.query.users.findFirst.mockResolvedValue(null);
    // Reset getCurrentUser default to admin
    (getCurrentUser as any).mockReturnValue({
      userId: 'clerk-admin',
      role: 'admin',
      sessionClaims: { metadata: { role: 'admin' } },
    });
  });

  it('returns 200 with the record for the self caller (non-admin)', async () => {
    (getCurrentUser as any).mockReturnValue({
      userId: 'clerk-self',
      role: 'manufacturer',
      sessionClaims: { metadata: { role: 'manufacturer' } },
    });
    mockDb.query.users.findFirst.mockResolvedValue(mockUser);

    const handler = getHandler(userRouter, 'get', '/:id');
    const { req, res, next } = createMockReqRes({ params: { id: '42' } });

    await handler(req, res, next);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });

  it('returns 200 with the record for an admin reading any other user', async () => {
    (getCurrentUser as any).mockReturnValue({
      userId: 'clerk-admin',
      role: 'admin',
      sessionClaims: { metadata: { role: 'admin' } },
    });
    mockDb.query.users.findFirst.mockResolvedValue(mockUser);

    const handler = getHandler(userRouter, 'get', '/:id');
    const { req, res, next } = createMockReqRes({ params: { id: '42' } });

    await handler(req, res, next);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });

  it('returns 404 (not 403, not the record) for a non-admin reading a different user', async () => {
    (getCurrentUser as any).mockReturnValue({
      userId: 'clerk-other',
      role: 'retailer',
      sessionClaims: { metadata: { role: 'retailer' } },
    });
    mockDb.query.users.findFirst.mockResolvedValue(mockUser);

    const handler = getHandler(userRouter, 'get', '/:id');
    const { req, res, next } = createMockReqRes({ params: { id: '42' } });

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    expect(res.status).not.toHaveBeenCalledWith(403);
    // must NOT leak the record
    expect(res.json).not.toHaveBeenCalledWith(mockUser);
  });

  it('returns 404 for a non-existent id (same response as the deny above)', async () => {
    (getCurrentUser as any).mockReturnValue({
      userId: 'clerk-other',
      role: 'retailer',
      sessionClaims: { metadata: { role: 'retailer' } },
    });
    mockDb.query.users.findFirst.mockResolvedValue(null);

    const handler = getHandler(userRouter, 'get', '/:id');
    const { req, res, next } = createMockReqRes({ params: { id: '999' } });

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('returns 400 for an invalid (non-numeric) id', async () => {
    const handler = getHandler(userRouter, 'get', '/:id');
    const { req, res, next } = createMockReqRes({ params: { id: 'abc' } });

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid user ID' });
  });
});
