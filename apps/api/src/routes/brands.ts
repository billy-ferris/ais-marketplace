import { Router, type Router as RouterType } from 'express';
import { eq, isNull, ilike, and, ne, count } from 'drizzle-orm';
import { db } from '../db/index';
import { brands, companies } from '../db/schema/index';
import {
  createBrandSchema,
  updateBrandSchema,
} from '@ais/shared/schemas';
import { requireAuth, requireRole } from '../middleware/auth';

const router: RouterType = Router();

/**
 * Generate a URL-safe slug from a name string.
 * Lowercases, replaces spaces/special chars with hyphens, trims leading/trailing hyphens.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Find a unique slug by appending -2, -3, etc. if the base slug already exists.
 * Optionally excludes a specific brand ID (for updates).
 */
async function findUniqueSlug(
  baseSlug: string,
  excludeId?: number,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const conditions = [eq(brands.slug, slug)];
    if (excludeId !== undefined) {
      conditions.push(ne(brands.id, excludeId));
    }

    const [existing] = await db
      .select({ id: brands.id })
      .from(brands)
      .where(and(...conditions));

    if (!existing) {
      return slug;
    }

    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }
}

// GET / - List brands with pagination, search, and companyId filter
router.get('/', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    const companyId = req.query.companyId
      ? Number(req.query.companyId)
      : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [isNull(brands.deletedAt)];

    if (search) {
      conditions.push(ilike(brands.name, `%${search}%`));
    }
    if (companyId) {
      conditions.push(eq(brands.companyId, companyId));
    }

    const whereClause = and(...conditions);

    const [data, [{ total }]] = await Promise.all([
      db
        .select({
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
          description: brands.description,
          logoUrl: brands.logoUrl,
          companyId: brands.companyId,
          companyName: companies.name,
          createdAt: brands.createdAt,
          updatedAt: brands.updatedAt,
        })
        .from(brands)
        .leftJoin(companies, eq(brands.companyId, companies.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(brands.name),
      db
        .select({ total: count() })
        .from(brands)
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

// GET /:id - Get brand by ID with company relation
router.get('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid brand ID' });
      return;
    }

    const [brand] = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        description: brands.description,
        logoUrl: brands.logoUrl,
        companyId: brands.companyId,
        companyName: companies.name,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
      })
      .from(brands)
      .leftJoin(companies, eq(brands.companyId, companies.id))
      .where(and(eq(brands.id, id), isNull(brands.deletedAt)));

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    res.json(brand);
  } catch (err) {
    next(err);
  }
});

// POST / - Create a new brand
router.post('/', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const data = createBrandSchema.parse(req.body);
    const baseSlug = generateSlug(data.name);
    const slug = await findUniqueSlug(baseSlug);

    const [brand] = await db
      .insert(brands)
      .values({ ...data, slug })
      .returning();

    res.status(201).json(brand);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id - Update a brand
router.patch('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid brand ID' });
      return;
    }

    const data = updateBrandSchema.parse(req.body);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    // Regenerate slug if name is being updated
    if (data.name) {
      const baseSlug = generateSlug(data.name);
      updateData.slug = await findUniqueSlug(baseSlug, id);
    }

    const [brand] = await db
      .update(brands)
      .set(updateData)
      .where(and(eq(brands.id, id), isNull(brands.deletedAt)))
      .returning();

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    res.json(brand);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id - Soft delete a brand
router.delete('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid brand ID' });
      return;
    }

    const [brand] = await db
      .update(brands)
      .set({ deletedAt: new Date() })
      .where(and(eq(brands.id, id), isNull(brands.deletedAt)))
      .returning();

    if (!brand) {
      res.status(404).json({ error: 'Brand not found' });
      return;
    }

    res.json({ message: 'Brand deleted' });
  } catch (err) {
    next(err);
  }
});

export { router as brandRouter };
