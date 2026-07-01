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

// PutObjectCommand is a constructor that records its input so tests can assert
// the signed ContentType / ContentLength.
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({})),
  PutObjectCommand: vi.fn().mockImplementation((input) => ({ input })),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi
    .fn()
    .mockResolvedValue('https://mock-r2.example.com/put-url'),
}));

// ---------- Imports (after mocks) ----------

import { uploadRouter } from '../../routes/uploads';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    vi.mocked(getSignedUrl).mockResolvedValue(
      'https://mock-r2.example.com/put-url' as any,
    );
  });

  describe('POST /api/uploads/presigned-url', () => {
    const handler = getHandler(uploadRouter, 'post', '/presigned-url');

    it('should return uploadUrl, publicUrl, and key (no url, no fields)', async () => {
      const { req, res, next } = createMockReqRes({
        body: { fileName: 'test.jpg', contentType: 'image/jpeg', fileSize: 1024 },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      const payload = (res.json as any).mock.calls[0][0];
      expect(payload).toHaveProperty('uploadUrl');
      expect(payload).toHaveProperty('publicUrl');
      expect(payload).toHaveProperty('key');
      expect(payload).not.toHaveProperty('url');
      expect(payload).not.toHaveProperty('fields');
      expect(payload.uploadUrl).toBe('https://mock-r2.example.com/put-url');
      expect(getSignedUrl).toHaveBeenCalledOnce();
    });

    it('should generate unique key with timestamp prefix', async () => {
      const { req, res, next } = createMockReqRes({
        body: { fileName: 'photo.png', contentType: 'image/png', fileSize: 2048 },
      });

      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      expect(payload.key).toMatch(/^images\/\d+-/);
      expect(payload.key).toContain('photo.png');
    });

    it('should sign a PutObjectCommand with ContentType and exact ContentLength', async () => {
      const { req, res, next } = createMockReqRes({
        body: { fileName: 'img.webp', contentType: 'image/webp', fileSize: 4096 },
      });

      await handler(req, res, next);

      expect(getSignedUrl).toHaveBeenCalledOnce();
      // PutObjectCommand mock records its input on the constructed instance.
      expect(PutObjectCommand).toHaveBeenCalledOnce();
      const commandInput = (PutObjectCommand as any).mock.calls[0][0];
      expect(commandInput.ContentType).toBe('image/webp');
      expect(commandInput.ContentLength).toBe(4096);
    });

    it.each(['image/svg+xml', 'image/gif', 'text/html'])(
      'should reject unsupported content type %s with 400 and not sign',
      async (contentType) => {
        const { req, res, next } = createMockReqRes({
          body: { fileName: 'evil.svg', contentType, fileSize: 1024 },
        });

        await handler(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'Unsupported content type',
        });
        expect(getSignedUrl).not.toHaveBeenCalled();
      },
    );

    it.each(['image/jpeg', 'image/png', 'image/webp'])(
      'should accept allowlisted content type %s',
      async (contentType) => {
        const { req, res, next } = createMockReqRes({
          body: { fileName: 'ok.img', contentType, fileSize: 1024 },
        });

        await handler(req, res, next);

        expect(getSignedUrl).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalledWith(400);
      },
    );

    it('should reject fileSize greater than 5 MB with 400 and not sign', async () => {
      const { req, res, next } = createMockReqRes({
        body: {
          fileName: 'big.jpg',
          contentType: 'image/jpeg',
          fileSize: FIVE_MB + 1,
        },
      });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'File exceeds the 5 MB limit',
      });
      expect(getSignedUrl).not.toHaveBeenCalled();
    });

    it('should accept a fileSize exactly at the 5 MB boundary', async () => {
      const { req, res, next } = createMockReqRes({
        body: {
          fileName: 'edge.jpg',
          contentType: 'image/jpeg',
          fileSize: FIVE_MB,
        },
      });

      await handler(req, res, next);

      expect(getSignedUrl).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalledWith(400);
    });

    it('should require admin role', () => {
      const layer = (uploadRouter as any).stack.find(
        (l: any) => l.route?.path === '/presigned-url' && l.route?.methods.post,
      );
      expect(layer).toBeDefined();
      expect(layer.route.stack.length).toBeGreaterThanOrEqual(3); // auth + role + handler
    });

    it('should reject request without fileName, contentType, or fileSize', async () => {
      // Missing all
      {
        const { req, res, next } = createMockReqRes({ body: {} });
        await handler(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          error: 'fileName, contentType, and fileSize are required',
        });
      }

      // Missing contentType
      {
        const { req, res, next } = createMockReqRes({
          body: { fileName: 'test.jpg', fileSize: 1024 },
        });
        await handler(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
      }

      // Missing fileName
      {
        const { req, res, next } = createMockReqRes({
          body: { contentType: 'image/jpeg', fileSize: 1024 },
        });
        await handler(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
      }

      // Missing fileSize
      {
        const { req, res, next } = createMockReqRes({
          body: { fileName: 'test.jpg', contentType: 'image/jpeg' },
        });
        await handler(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
      }

      // Non-numeric fileSize
      {
        const { req, res, next } = createMockReqRes({
          body: { fileName: 'test.jpg', contentType: 'image/jpeg', fileSize: 'big' },
        });
        await handler(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
      }

      // Zero / negative fileSize
      {
        const { req, res, next } = createMockReqRes({
          body: { fileName: 'test.jpg', contentType: 'image/jpeg', fileSize: 0 },
        });
        await handler(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
      }

      expect(getSignedUrl).not.toHaveBeenCalled();
    });
  });
});
