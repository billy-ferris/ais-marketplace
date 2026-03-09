import { Router, type Router as RouterType } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { companies } from '../db/schema/index.js';
import {
  createCompanySchema,
  updateCompanySchema,
} from '@ais/shared/schemas';

const router: RouterType = Router();

// GET / - List all companies
router.get('/', async (_req, res, next) => {
  try {
    const result = await db.select().from(companies);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /:id - Get company by ID
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid company ID' });
      return;
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));

    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    res.json(company);
  } catch (err) {
    next(err);
  }
});

// POST / - Create a new company
router.post('/', async (req, res, next) => {
  try {
    const data = createCompanySchema.parse(req.body);

    const [company] = await db.insert(companies).values(data).returning();

    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id - Update a company
router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid company ID' });
      return;
    }

    const data = updateCompanySchema.parse(req.body);

    const [company] = await db
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();

    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    res.json(company);
  } catch (err) {
    next(err);
  }
});

export { router as companyRouter };
