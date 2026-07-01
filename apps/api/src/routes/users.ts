import { Router, type Router as RouterType } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { requireAuth, requireRole, getCurrentUser } from '../middleware/auth.js';

const router: RouterType = Router();

// GET /me - Get current authenticated user's data from local DB
router.get('/me', requireAuth(), async (req, res, next) => {
  try {
    const { userId } = getCurrentUser(req);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      with: { company: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found in local database' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET / - List all users with company relation (admin only)
router.get('/', requireAuth(), requireRole('admin'), async (_req, res, next) => {
  try {
    const result = await db.query.users.findMany({
      with: { company: true },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /:id - Get user by ID with company relation (self or admin only)
router.get('/:id', requireAuth(), async (req, res, next) => {
  try {
    const { userId, role } = getCurrentUser(req);

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: { company: true },
    });

    // Deny-by-404: a missing record and a record the caller may not read
    // return the SAME response, closing the id-enumeration oracle. Compare
    // against clerkId (the Clerk id string), never the numeric users.id.
    if (!user || (role !== 'admin' && user.clerkId !== userId)) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export { router as userRouter };
