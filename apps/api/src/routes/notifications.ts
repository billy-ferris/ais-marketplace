import { Router, type Router as RouterType } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '../db/index';
import { notifications, users } from '../db/schema/index';
import { requireAuth, getCurrentUser } from '../middleware/auth';

const router: RouterType = Router();

/**
 * Look up the local database user from the Clerk userId on the request.
 * Returns the user record or null if not found.
 */
async function getLocalUser(clerkId: string) {
  return db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: { id: true },
  });
}

// GET / - List notifications for current user with pagination
router.get('/', requireAuth(), async (req, res, next) => {
  try {
    const { userId: clerkId } = getCurrentUser(req);
    if (!clerkId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const localUser = await getLocalUser(clerkId);
    if (!localUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const whereClause = eq(notifications.userId, localUser.id);

    const [data, [{ total }]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(whereClause)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(notifications)
        .where(whereClause),
    ]);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /unread-count - Unread count for current user
router.get('/unread-count', requireAuth(), async (req, res, next) => {
  try {
    const { userId: clerkId } = getCurrentUser(req);
    if (!clerkId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const localUser = await getLocalUser(clerkId);
    if (!localUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const [{ unreadCount }] = await db
      .select({ unreadCount: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, localUser.id),
          eq(notifications.isRead, false),
        ),
      );

    res.json({ count: unreadCount });
  } catch (err) {
    next(err);
  }
});

// PATCH /:id/read - Mark single notification as read
router.patch('/:id/read', requireAuth(), async (req, res, next) => {
  try {
    const { userId: clerkId } = getCurrentUser(req);
    if (!clerkId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const localUser = await getLocalUser(clerkId);
    if (!localUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, localUser.id),
        ),
      )
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// PATCH /read-all - Mark all notifications as read
router.patch('/read-all', requireAuth(), async (req, res, next) => {
  try {
    const { userId: clerkId } = getCurrentUser(req);
    if (!clerkId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const localUser = await getLocalUser(clerkId);
    if (!localUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, localUser.id),
          eq(notifications.isRead, false),
        ),
      );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

export { router as notificationRouter };
