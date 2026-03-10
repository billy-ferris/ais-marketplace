import { Router, type Router as RouterType } from 'express';
import { eq, isNull, ilike, and, ne, asc, count } from 'drizzle-orm';
import { db } from '../db/index';
import { categories } from '../db/schema/index';
import {
  createCategorySchema,
  updateCategorySchema,
} from '@ais/shared/schemas';
import { requireAuth, requireRole } from '../middleware/auth';

const router: RouterType = Router();

/**
 * Generate a URL-safe slug from a name string.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Find a unique slug by appending -2, -3, etc. if the base slug already exists.
 */
async function findUniqueSlug(
  baseSlug: string,
  excludeId?: number,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const conditions = [eq(categories.slug, slug)];
    if (excludeId !== undefined) {
      conditions.push(ne(categories.id, excludeId));
    }

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(...conditions));

    if (!existing) {
      return slug;
    }

    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }
}

// GET / - List categories with pagination and search (read access for all authenticated roles)
router.get('/', requireAuth(), requireRole('admin', 'manufacturer', 'retailer'), async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [isNull(categories.deletedAt)];

    if (search) {
      conditions.push(ilike(categories.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const [data, [{ total }]] = await Promise.all([
      db
        .select()
        .from(categories)
        .where(whereClause)
        .orderBy(asc(categories.displayOrder))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(categories)
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

// GET /:id - Get category by ID (read access for all authenticated roles)
router.get('/:id', requireAuth(), requireRole('admin', 'manufacturer', 'retailer'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)));

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(category);
  } catch (err) {
    next(err);
  }
});

// POST / - Create a new category
router.post('/', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const baseSlug = generateSlug(data.name);
    const slug = await findUniqueSlug(baseSlug);

    const [category] = await db
      .insert(categories)
      .values({ ...data, slug })
      .returning();

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// PATCH /:id - Update a category
router.patch('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    const data = updateCategorySchema.parse(req.body);

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    // Regenerate slug if name is being updated
    if (data.name) {
      const baseSlug = generateSlug(data.name);
      updateData.slug = await findUniqueSlug(baseSlug, id);
    }

    const [category] = await db
      .update(categories)
      .set(updateData)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning();

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json(category);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id - Soft delete a category
router.delete('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid category ID' });
      return;
    }

    const [category] = await db
      .update(categories)
      .set({ deletedAt: new Date() })
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning();

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
});

export { router as categoryRouter };
