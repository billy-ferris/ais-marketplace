import { Router, type Router as RouterType } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { companies } from '../db/schema/index.js';
import {
  createCompanySchema,
  updateCompanySchema,
} from '@ais/shared/schemas';
import {
  requireAuth,
  requireRole,
  getCurrentUser,
  getCompanyUser,
} from '../middleware/auth.js';

const router: RouterType = Router();

type CompanyRow = typeof companies.$inferSelect;
type Viewer = { role: string | null; companyId: number | null };

/**
 * Response-shaping guard. Admins and the owning company see the full row;
 * every other authenticated viewer receives a redacted row with commercial
 * data (marginPercentage) and contact/precise-location PII stripped, while
 * name/type/city/state are retained so companies stay browsable (D-03).
 */
function redactCompany(company: CompanyRow, viewer: Viewer) {
  const isPrivileged =
    viewer.role === 'admin' || viewer.companyId === company.id;
  if (isPrivileged) return company;

  const {
    marginPercentage: _marginPercentage,
    contactName: _contactName,
    phone: _phone,
    street: _street,
    zip: _zip,
    ...safe
  } = company;
  return safe;
}

// GET / - List all companies (any authenticated user; sensitive fields redacted)
router.get('/', requireAuth(), async (req, res, next) => {
  try {
    const { role } = getCurrentUser(req);
    const companyUser = await getCompanyUser(req);
    const viewer: Viewer = { role, companyId: companyUser?.companyId ?? null };

    const result = await db.select().from(companies);
    res.json(result.map((c) => redactCompany(c, viewer)));
  } catch (err) {
    next(err);
  }
});

// GET /:id - Get company by ID (any authenticated user; sensitive fields redacted)
router.get('/:id', requireAuth(), async (req, res, next) => {
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

    const { role } = getCurrentUser(req);
    const companyUser = await getCompanyUser(req);
    const viewer: Viewer = { role, companyId: companyUser?.companyId ?? null };

    res.json(redactCompany(company, viewer));
  } catch (err) {
    next(err);
  }
});

// POST / - Create a new company (admin only)
router.post('/', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const data = createCompanySchema.parse(req.body);

    const [company] = await db.insert(companies).values(data).returning();

    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id - Update a company (admin only)
router.patch('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
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
