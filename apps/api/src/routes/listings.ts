import { Router, type Router as RouterType } from 'express';
import { eq, isNull, ilike, and, count, sql } from 'drizzle-orm';
import { db } from '../db/index';
import {
  brandListings,
  inventorySkus,
  brandListingImages,
  listingCategories,
  brands,
  categories,
} from '../db/schema/index';
import {
  createListingSchema,
  updateListingSchema,
  createSkuSchema,
  updateSkuSchema,
} from '@ais/shared/schemas';
import type { CreateSkuInput } from '@ais/shared/schemas';
import { requireAuth, requireRole } from '../middleware/auth';

const router: RouterType = Router();

/** Helper to filter out soft-deleted rows. */
const notDeleted = (table: { deletedAt: typeof brandListings.deletedAt }) =>
  isNull(table.deletedAt);

// GET / - List listings with pagination, search, status filter, brandId filter
router.get('/', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const brandId = req.query.brandId
      ? Number(req.query.brandId)
      : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [notDeleted(brandListings)];

    if (search) {
      conditions.push(ilike(brandListings.name, `%${search}%`));
    }
    if (status) {
      conditions.push(eq(brandListings.status, status as 'draft' | 'active' | 'sold_out' | 'archived'));
    }
    if (brandId) {
      conditions.push(eq(brandListings.brandId, brandId));
    }

    const whereClause = and(...conditions);

    // Subquery for SKU count per listing
    const skuCountSubquery = db
      .select({
        listingId: inventorySkus.listingId,
        skuCount: count().as('sku_count'),
      })
      .from(inventorySkus)
      .where(isNull(inventorySkus.deletedAt))
      .groupBy(inventorySkus.listingId)
      .as('sku_counts');

    const [data, [{ total }]] = await Promise.all([
      db
        .select({
          id: brandListings.id,
          name: brandListings.name,
          description: brandListings.description,
          brandId: brandListings.brandId,
          brandName: brands.name,
          status: brandListings.status,
          skuCount: sql<number>`coalesce(${skuCountSubquery.skuCount}, 0)`.mapWith(Number),
          createdAt: brandListings.createdAt,
          updatedAt: brandListings.updatedAt,
        })
        .from(brandListings)
        .leftJoin(brands, eq(brandListings.brandId, brands.id))
        .leftJoin(
          skuCountSubquery,
          eq(brandListings.id, skuCountSubquery.listingId),
        )
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(brandListings.createdAt),
      db
        .select({ total: count() })
        .from(brandListings)
        .where(whereClause),
    ]);

    // Fetch categories for all returned listings in one query
    const listingIds = data.map((d) => d.id);
    let categoriesByListing: Record<number, { id: number; name: string }[]> = {};

    if (listingIds.length > 0) {
      const cats = await db
        .select({
          listingId: listingCategories.listingId,
          categoryId: categories.id,
          categoryName: categories.name,
        })
        .from(listingCategories)
        .innerJoin(categories, eq(listingCategories.categoryId, categories.id))
        .where(
          and(
            sql`${listingCategories.listingId} IN (${sql.join(listingIds.map((id) => sql`${id}`), sql`, `)})`,
            isNull(categories.deletedAt),
          ),
        );

      categoriesByListing = cats.reduce(
        (acc, row) => {
          if (!acc[row.listingId]) acc[row.listingId] = [];
          acc[row.listingId].push({
            id: row.categoryId,
            name: row.categoryName,
          });
          return acc;
        },
        {} as Record<number, { id: number; name: string }[]>,
      );
    }

    const enrichedData = data.map((listing) => ({
      ...listing,
      categories: categoriesByListing[listing.id] ?? [],
    }));

    res.json({
      data: enrichedData,
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

// GET /:id - Get listing by ID with full relations
router.get('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    const listing = await db.query.brandListings.findFirst({
      where: and(eq(brandListings.id, id), notDeleted(brandListings)),
      with: {
        brand: {
          with: {
            company: true,
          },
        },
        inventorySkus: {
          where: isNull(inventorySkus.deletedAt),
        },
        brandListingImages: {
          orderBy: (images, { asc }) => [asc(images.displayOrder)],
        },
        listingCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Flatten listingCategories to just categories (filter out deleted)
    const responseCategories = listing.listingCategories
      .filter((lc) => lc.category.deletedAt === null)
      .map((lc) => lc.category);

    res.json({
      ...listing,
      categories: responseCategories,
      listingCategories: undefined,
    });
  } catch (err) {
    next(err);
  }
});

// POST / - Create a new listing with optional nested SKUs, images, and categories
router.post('/', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const { listing: listingData, skus, images, categoryIds } = req.body;

    const parsedListing = createListingSchema.parse(listingData);

    // Insert the listing
    const [newListing] = await db
      .insert(brandListings)
      .values({
        name: parsedListing.name,
        description: parsedListing.description,
        brandId: parsedListing.brandId,
        status: parsedListing.status,
      })
      .returning();

    const listingId = newListing.id;

    // Insert SKUs if provided
    if (skus && Array.isArray(skus) && skus.length > 0) {
      const parsedSkus: CreateSkuInput[] = skus.map((s: unknown) => createSkuSchema.parse(s));
      await db.insert(inventorySkus).values(
        parsedSkus.map((sku) => ({
          listingId,
          name: sku.name,
          description: sku.description,
          upc: sku.upc,
          size: sku.size,
          casePack: sku.casePack,
          price: sku.price,
          msrp: sku.msrp,
          quantity: sku.quantity,
          imageUrl: sku.imageUrl,
        })),
      );
    }

    // Insert images if provided (max 5)
    if (images && Array.isArray(images) && images.length > 0) {
      const imageSlice = images.slice(0, 5);

      // Ensure exactly one isPrimary
      const hasPrimary = imageSlice.some((img: { isPrimary?: boolean }) => img.isPrimary);
      const imageValues = imageSlice.map(
        (img: { imageUrl: string; displayOrder: number; isPrimary?: boolean }, index: number) => ({
          listingId,
          imageUrl: img.imageUrl,
          displayOrder: img.displayOrder ?? index,
          isPrimary: hasPrimary ? !!img.isPrimary : index === 0,
        }),
      );

      await db.insert(brandListingImages).values(imageValues);
    }

    // Insert category associations if provided
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await db.insert(listingCategories).values(
        categoryIds.map((categoryId: number) => ({
          listingId,
          categoryId,
        })),
      );
    }

    // Re-query with full relations
    const fullListing = await db.query.brandListings.findFirst({
      where: eq(brandListings.id, listingId),
      with: {
        brand: {
          with: {
            company: true,
          },
        },
        inventorySkus: {
          where: isNull(inventorySkus.deletedAt),
        },
        brandListingImages: {
          orderBy: (imgs, { asc }) => [asc(imgs.displayOrder)],
        },
        listingCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    const responseCategories = fullListing!.listingCategories
      .filter((lc) => lc.category.deletedAt === null)
      .map((lc) => lc.category);

    res.status(201).json({
      ...fullListing,
      categories: responseCategories,
      listingCategories: undefined,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /:id - Update listing with granular SKU, image, and category management
router.patch('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    // Check listing exists and is not deleted
    const [existing] = await db
      .select({ id: brandListings.id })
      .from(brandListings)
      .where(and(eq(brandListings.id, id), notDeleted(brandListings)));

    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const { listing: listingData, skus, images, categoryIds } = req.body;

    // Update listing fields if provided
    if (listingData && Object.keys(listingData).length > 0) {
      const parsed = updateListingSchema.parse(listingData);
      await db
        .update(brandListings)
        .set({ ...parsed, updatedAt: new Date() })
        .where(eq(brandListings.id, id));
    }

    // Handle SKU operations
    if (skus) {
      // Create new SKUs
      if (skus.create && Array.isArray(skus.create) && skus.create.length > 0) {
        const parsedSkus: CreateSkuInput[] = skus.create.map((s: unknown) => createSkuSchema.parse(s));
        await db.insert(inventorySkus).values(
          parsedSkus.map((sku) => ({
            listingId: id,
            name: sku.name,
            description: sku.description,
            upc: sku.upc,
            size: sku.size,
            casePack: sku.casePack,
            price: sku.price,
            msrp: sku.msrp,
            quantity: sku.quantity,
            imageUrl: sku.imageUrl,
          })),
        );
      }

      // Update existing SKUs
      if (skus.update && Array.isArray(skus.update)) {
        for (const skuUpdate of skus.update) {
          const parsed = updateSkuSchema.parse(skuUpdate.data);
          await db
            .update(inventorySkus)
            .set({ ...parsed, updatedAt: new Date() })
            .where(
              and(
                eq(inventorySkus.id, skuUpdate.id),
                eq(inventorySkus.listingId, id),
              ),
            );
        }
      }

      // Soft-delete SKUs
      if (skus.delete && Array.isArray(skus.delete)) {
        for (const skuId of skus.delete) {
          await db
            .update(inventorySkus)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(inventorySkus.id, skuId),
                eq(inventorySkus.listingId, id),
              ),
            );
        }
      }
    }

    // Handle image operations
    if (images) {
      // Create new images (enforce max 5 total non-deleted)
      if (images.create && Array.isArray(images.create) && images.create.length > 0) {
        const [{ existingCount }] = await db
          .select({ existingCount: count() })
          .from(brandListingImages)
          .where(eq(brandListingImages.listingId, id));

        const remaining = 5 - existingCount;
        if (remaining > 0) {
          const newImages = images.create.slice(0, remaining);
          await db.insert(brandListingImages).values(
            newImages.map(
              (img: { imageUrl: string; displayOrder: number; isPrimary?: boolean }) => ({
                listingId: id,
                imageUrl: img.imageUrl,
                displayOrder: img.displayOrder ?? 0,
                isPrimary: !!img.isPrimary,
              }),
            ),
          );
        }
      }

      // Hard-delete image rows
      if (images.delete && Array.isArray(images.delete)) {
        for (const imageId of images.delete) {
          await db
            .delete(brandListingImages)
            .where(
              and(
                eq(brandListingImages.id, imageId),
                eq(brandListingImages.listingId, id),
              ),
            );
        }
      }
    }

    // Replace categories if provided
    if (categoryIds !== undefined && Array.isArray(categoryIds)) {
      // Delete all existing listing_categories for this listing
      await db
        .delete(listingCategories)
        .where(eq(listingCategories.listingId, id));

      // Re-insert the new set
      if (categoryIds.length > 0) {
        await db.insert(listingCategories).values(
          categoryIds.map((categoryId: number) => ({
            listingId: id,
            categoryId,
          })),
        );
      }
    }

    // Re-query with full relations
    const updatedListing = await db.query.brandListings.findFirst({
      where: eq(brandListings.id, id),
      with: {
        brand: {
          with: {
            company: true,
          },
        },
        inventorySkus: {
          where: isNull(inventorySkus.deletedAt),
        },
        brandListingImages: {
          orderBy: (imgs, { asc }) => [asc(imgs.displayOrder)],
        },
        listingCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    const responseCategories = updatedListing!.listingCategories
      .filter((lc) => lc.category.deletedAt === null)
      .map((lc) => lc.category);

    res.json({
      ...updatedListing,
      categories: responseCategories,
      listingCategories: undefined,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id - Soft delete listing with cascade
router.delete('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    const [listing] = await db
      .update(brandListings)
      .set({ deletedAt: new Date() })
      .where(and(eq(brandListings.id, id), notDeleted(brandListings)))
      .returning();

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Cascade soft-delete all SKUs belonging to this listing
    await db
      .update(inventorySkus)
      .set({ deletedAt: new Date() })
      .where(eq(inventorySkus.listingId, id));

    // Hard-delete listing_categories join rows
    await db
      .delete(listingCategories)
      .where(eq(listingCategories.listingId, id));

    // Hard-delete brand_listing_images rows
    await db
      .delete(brandListingImages)
      .where(eq(brandListingImages.listingId, id));

    res.json({ message: 'Listing deleted' });
  } catch (err) {
    next(err);
  }
});

export { router as listingRouter };
