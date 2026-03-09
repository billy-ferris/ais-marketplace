import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Mock @clerk/express before importing auth middleware
vi.mock('@clerk/express', () => ({
  clerkMiddleware: vi.fn(),
  requireAuth: vi.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
  getAuth: vi.fn(),
}));

import { getAuth } from '@clerk/express';
import { requireRole, requireAuth } from '../middleware/auth';

const mockedGetAuth = vi.mocked(getAuth);

function createMockReqRes() {
  const req = {} as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('RBAC Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireRole', () => {
    it('should allow access when user has the required role', () => {
      const { req, res, next } = createMockReqRes();
      mockedGetAuth.mockReturnValue({
        sessionClaims: { metadata: { role: 'admin' } },
      } as any);

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks the required role', () => {
      const { req, res, next } = createMockReqRes();
      mockedGetAuth.mockReturnValue({
        sessionClaims: { metadata: { role: 'retailer' } },
      } as any);

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('should return 403 when no role exists in session claims', () => {
      const { req, res, next } = createMockReqRes();
      mockedGetAuth.mockReturnValue({
        sessionClaims: { metadata: {} },
      } as any);

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });
  });

  describe('requireAuth', () => {
    it('should be a callable function that returns middleware', () => {
      // requireAuth is re-exported from @clerk/express
      // Verify it is accessible and callable
      expect(typeof requireAuth).toBe('function');
    });

    it('should return a middleware function when invoked', () => {
      const middleware = requireAuth();
      expect(typeof middleware).toBe('function');
    });
  });
});
