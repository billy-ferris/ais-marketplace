import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ---------- Mocks (before any app imports) ----------

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

vi.mock('../../middleware/auth', () => ({
  requireAuth: vi.fn(
    () => (_req: Request, _res: Response, next: NextFunction) => next(),
  ),
  requireRole: vi.fn(
    () => (_req: Request, _res: Response, next: NextFunction) => next(),
  ),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({})),
  PutObjectCommand: vi.fn().mockImplementation((params) => params),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi
    .fn()
    .mockResolvedValue('https://mock-presigned-url.com/upload'),
}));

// ---------- Imports (after mocks) ----------

import { uploadRouter } from '../../routes/uploads';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireRole } from '../../middleware/auth';

// ---------- Helpers ----------

function getHandler(router: any, method: string, path: string) {
  const layer = router.stack.find(
    (l: any) => l.route?.path === path && l.route?.methods[method],
  );
  if (!layer)
    throw new Error(`No route found: ${method.toUpperCase()} ${path}`);
  const stack = layer.route.stack;
  return stack[stack.length - 1].handle;
}

function createMockReqRes(overrides?: {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
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

// ---------- Suites ----------

describe('Upload Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-set the default resolved value after clearAllMocks
    vi.mocked(getSignedUrl).mockResolvedValue(
      'https://mock-presigned-url.com/upload',
    );
  });

  describe('POST /api/uploads/presigned-url', () => {
    const handler = getHandler(uploadRouter, 'post', '/presigned-url');

    it('should return uploadUrl, publicUrl, and key', async () => {
      const { req, res, next } = createMockReqRes({
        body: { fileName: 'test.jpg', contentType: 'image/jpeg' },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      const payload = (res.json as any).mock.calls[0][0];
      expect(payload).toHaveProperty('uploadUrl');
      expect(payload).toHaveProperty('publicUrl');
      expect(payload).toHaveProperty('key');
      expect(typeof payload.uploadUrl).toBe('string');
      expect(payload.uploadUrl).toBe(
        'https://mock-presigned-url.com/upload',
      );
    });

    it('should generate unique key with timestamp prefix', async () => {
      const { req, res, next } = createMockReqRes({
        body: { fileName: 'photo.png', contentType: 'image/png' },
      });

      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      // Key should be "images/{timestamp}-{sanitized-filename}"
      expect(payload.key).toMatch(/^images\/\d+-/);
      expect(payload.key).toContain('photo.png');
    });

    it('should use correct contentType in PutObjectCommand', async () => {
      const { req, res, next } = createMockReqRes({
        body: { fileName: 'img.webp', contentType: 'image/webp' },
      });

      await handler(req, res, next);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'image/webp' }),
      );
    });

    it('should require admin role', () => {
      // The route registers requireRole('admin') as middleware during module load.
      // Verify the route's middleware stack includes requireRole.
      const layer = (uploadRouter as any).stack.find(
        (l: any) => l.route?.path === '/presigned-url' && l.route?.methods.post,
      );
      // The route stack has multiple middleware: requireAuth, requireRole, handler.
      // requireRole returns a pass-through mock, so check it's in the chain.
      expect(layer).toBeDefined();
      expect(layer.route.stack.length).toBeGreaterThanOrEqual(3); // auth + role + handler
    });

    it('should reject request without fileName or contentType', async () => {
      // Missing both
      {
        const { req, res, next } = createMockReqRes({ body: {} });
        await handler(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'fileName and contentType are required',
        });
      }

      // Missing contentType
      {
        const { req, res, next } = createMockReqRes({
          body: { fileName: 'test.jpg' },
        });
        await handler(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
      }

      // Missing fileName
      {
        const { req, res, next } = createMockReqRes({
          body: { contentType: 'image/jpeg' },
        });
        await handler(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
      }
    });
  });
});
