import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

const { mockDb } = vi.hoisted(() => {
  const mockDb: any = {};
  return { mockDb };
});

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
  getCurrentUser: vi.fn().mockReturnValue({
    userId: 'test-user',
    role: 'admin',
  }),
  getCompanyUser: vi.fn().mockResolvedValue({
    id: 1,
    companyId: 1,
    role: 'admin',
  }),
}));

vi.mock('../../db/index', () => {
  mockDb.select = vi.fn().mockReturnValue(mockDb);
  mockDb.from = vi.fn().mockReturnValue(mockDb);
  mockDb.where = vi.fn().mockReturnValue(mockDb);
  mockDb.orderBy = vi.fn().mockReturnValue(mockDb);
  mockDb.limit = vi.fn().mockReturnValue(mockDb);
  mockDb.offset = vi.fn().mockReturnValue(mockDb);
  mockDb.update = vi.fn().mockReturnValue(mockDb);
  mockDb.set = vi.fn().mockReturnValue(mockDb);
  mockDb.returning = vi.fn().mockResolvedValue([]);
  mockDb.then = undefined;
  mockDb.query = {
    users: { findFirst: vi.fn() },
  };
  return { db: mockDb };
});

import { notificationRouter } from '../../routes/notifications';

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

const mockNotification = {
  id: 1,
  userId: 1,
  type: 'listing_approved',
  title: 'Listing Approved',
  message: 'Your listing has been approved',
  isRead: false,
  createdAt: new Date('2026-01-15'),
};

describe('Notification Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.orderBy.mockReturnValue(mockDb);
    mockDb.limit.mockReturnValue(mockDb);
    mockDb.offset.mockReturnValue(mockDb);
    mockDb.update.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
    mockDb.returning.mockResolvedValue([]);
    mockDb.then = undefined;
    mockDb.query.users.findFirst.mockResolvedValue({ id: 1 });
  });

  describe('GET /api/notifications', () => {
    it('should return paginated notifications for current user', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockNotification]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(notificationRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        data: [mockNotification],
        pagination: { page: 1, limit: 20, total: 1, pageCount: 1 },
      });
    });

    it('should return only notifications belonging to authenticated user', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockNotification]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(notificationRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.query.users.findFirst).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: [mockNotification] }),
      );
    });

    it('should order notifications by createdAt descending', async () => {
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) resolve([mockNotification]);
        else resolve([{ total: 1 }]);
      });

      const handler = getHandler(notificationRouter, 'get', '/');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return count of unread notifications for current user', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([{ unreadCount: 5 }]);
      });

      const handler = getHandler(notificationRouter, 'get', '/unread-count');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ count: 5 });
    });

    it('should return 0 when no unread notifications exist', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve([{ unreadCount: 0 }]);
      });

      const handler = getHandler(notificationRouter, 'get', '/unread-count');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ count: 0 });
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const updatedNotification = { ...mockNotification, isRead: true };
      mockDb.returning.mockResolvedValue([updatedNotification]);

      const handler = getHandler(notificationRouter, 'patch', '/:id/read');
      const { req, res, next } = createMockReqRes({ params: { id: '1' } });

      await handler(req, res, next);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith({ isRead: true });
      expect(res.json).toHaveBeenCalledWith(updatedNotification);
    });

    it('should return 404 for notification not belonging to user', async () => {
      mockDb.returning.mockResolvedValue([]);

      const handler = getHandler(notificationRouter, 'patch', '/:id/read');
      const { req, res, next } = createMockReqRes({ params: { id: '999' } });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('should mark all notifications as read for current user', async () => {
      mockDb.then = vi.fn((resolve: any) => {
        resolve(undefined);
      });

      const handler = getHandler(notificationRouter, 'patch', '/read-all');
      const { req, res, next } = createMockReqRes();

      await handler(req, res, next);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith({ isRead: true });
      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'All notifications marked as read' });
    });
  });
});
