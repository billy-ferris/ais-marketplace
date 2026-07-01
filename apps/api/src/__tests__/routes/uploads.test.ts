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
}));

vi.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: vi.fn().mockResolvedValue({
    url: 'https://mock-post-url.com/bucket',
    fields: { key: 'images/mock-key', 'Content-Type': 'image/jpeg' },
  }),
}));

// ---------- Imports (after mocks) ----------

import { uploadRouter } from '../../routes/uploads';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';

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

const FIVE_MB = 5 * 1024 * 1024; // 5242880

// ---------- Suites ----------

describe('Upload Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createPresignedPost).mockResolvedValue({
      url: 'https://mock-post-url.com/bucket',
      fields: { key: 'images/mock-key', 'Content-Type': 'image/jpeg' },
    } as any);
  });

  describe('POST /api/uploads/presigned-url', () => {
    const handler = getHandler(uploadRouter, 'post', '/presigned-url');

    it('should return url, fields, publicUrl, and key (no uploadUrl)', async () => {
      const { req, res, next } = createMockReqRes({
        body: { fileName: 'test.jpg', contentType: 'image/jpeg' },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      const payload = (res.json as any).mock.calls[0][0];
      expect(payload).toHaveProperty('url');
      expect(payload).toHaveProperty('fields');
      expect(payload).toHaveProperty('publicUrl');
      expect(payload).toHaveProperty('key');
      expect(payload).not.toHaveProperty('uploadUrl');
      expect(payload.url).toBe('https://mock-post-url.com/bucket');
    });

    it('should generate unique key with timestamp prefix', async () => {
      const { req, res, next } = createMockReqRes({
        body: { fileName: 'photo.png', contentType: 'image/png' },
      });

      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      expect(payload.key).toMatch(/^images\/\d+-/);
      expect(payload.key).toContain('photo.png');
    });

    it('should sign a createPresignedPost with a 5 MB content-length-range condition', async () => {
      const { req, res, next } = createMockReqRes({
        body: { fileName: 'img.webp', contentType: 'image/webp' },
      });

      await handler(req, res, next);

      expect(createPresignedPost).toHaveBeenCalledOnce();
      const [, params] = (createPresignedPost as any).mock.calls[0];
      expect(params.Conditions).toEqual(
        expect.arrayContaining([['content-length-range', 1, FIVE_MB]]),
      );
      // Content-Type is pinned server-side
      expect(params.Conditions).toEqual(
        expect.arrayContaining([['eq', '$Content-Type', 'image/webp']]),
      );
      expect(params.Fields).toEqual(
        expect.objectContaining({ 'Content-Type': 'image/webp' }),
      );
    });

    it.each(['image/svg+xml', 'image/gif', 'text/html'])(
      'should reject unsupported content type %s with 400 and not sign',
      async (contentType) => {
        const { req, res, next } = createMockReqRes({
          body: { fileName: 'evil.svg', contentType },
        });

        await handler(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Unsupported content type',
        });
        expect(createPresignedPost).not.toHaveBeenCalled();
      },
    );

    it.each(['image/jpeg', 'image/png', 'image/webp'])(
      'should accept allowlisted content type %s',
      async (contentType) => {
        const { req, res, next } = createMockReqRes({
          body: { fileName: 'ok.img', contentType },
        });

        await handler(req, res, next);

        expect(createPresignedPost).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalledWith(400);
      },
    );

    it('should require admin role', () => {
      const layer = (uploadRouter as any).stack.find(
        (l: any) => l.route?.path === '/presigned-url' && l.route?.methods.post,
      );
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

      expect(createPresignedPost).not.toHaveBeenCalled();
    });
  });
});
