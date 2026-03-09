import { Router, type Router as RouterType } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';

const router: RouterType = Router();

// GET / - List all users with company relation
router.get('/', async (_req, res, next) => {
  try {
    const result = await db.query.users.findMany({
      with: { company: true },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /:id - Get user by ID with company relation
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
      with: { company: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export { router as userRouter };
