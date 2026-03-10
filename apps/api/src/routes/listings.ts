import { Router, type Router as RouterType } from 'express';
import { eq, isNull, ilike, and, count, sql, inArray } from 'drizzle-orm';
import { db } from '../db/index';
import {
  brandListings,
  inventorySkus,
  brandListingImages,
  listingCategories,
  brands,
  categories,
  users,
} from '../db/schema/index';
import {
  createListingSchema,
  updateListingSchema,
  createSkuSchema,
  updateSkuSchema,
} from '@ais/shared/schemas';
import type { CreateSkuInput } from '@ais/shared/schemas';
import { requireAuth, requireRole, getCurrentUser, getCompanyUser } from '../middleware/auth';
import { notifyApprovalEvent } from '../services/notification';

const router: RouterType = Router();

/** Helper to filter out soft-deleted rows. */
const notDeleted = (table: { deletedAt: typeof brandListings.deletedAt }) =>
  isNull(table.deletedAt);

/**
 * Helper to verify a listing belongs to the manufacturer's company.
 * Returns the listing if found, or null if not belonging to the user's company.
 */
async function getListingForCompany(listingId: number, companyId: number) {
  const listing = await db.query.brandListings.findFirst({
    where: and(eq(brandListings.id, listingId), notDeleted(brandListings)),
    with: {
      brand: {
        columns: { companyId: true },
      },
    },
  });

  if (!listing || listing.brand.companyId !== companyId) {
    return null;
  }

  return listing;
}

/**
 * Helper to find all users belonging to a company (for notifications).
 */
async function getCompanyUserIds(companyId: number): Promise<number[]> {
  const companyUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.companyId, companyId));
  return companyUsers.map((u) => u.id);
}

/**
 * Helper to get all admin user IDs (for notifications).
 */
async function getAdminUserIds(): Promise<number[]> {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'admin'));
  return admins.map((u) => u.id);
}

// GET / - List listings with pagination, search, status filter, brandId filter
router.get('/', requireAuth(), requireRole('admin', 'manufacturer'), async (req, res, next) => {
  try {
    const { role } = getCurrentUser(req);
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
      conditions.push(eq(brandListings.status, status as 'draft' | 'active' | 'sold_out' | 'archived' | 'pending_approval' | 'rejected'));
    }
    if (brandId) {
      conditions.push(eq(brandListings.brandId, brandId));
    }

    // Manufacturer: scope to their company's brands
    if (role === 'manufacturer') {
      const user = await getCompanyUser(req);
      if (!user?.companyId) {
        res.status(403).json({ error: 'No company associated with your account' });
        return;
      }
      conditions.push(eq(brands.companyId, user.companyId));
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
          rejectionReason: brandListings.rejectionReason,
          skuCount: sql<number>`coalesce(${skuCountSubquery.skuCount}, 0)`.mapWith(Number),
          createdAt: brandListings.createdAt,
          updatedAt: brandListings.updatedAt,
        })
        .from(brandListings)
        .innerJoin(brands, eq(brandListings.brandId, brands.id))
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
        .innerJoin(brands, eq(brandListings.brandId, brands.id))
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
router.get('/:id', requireAuth(), requireRole('admin', 'manufacturer'), async (req, res, next) => {
  try {
    const { role } = getCurrentUser(req);
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

    // Manufacturer can only see their own company's listings
    if (role === 'manufacturer') {
      const user = await getCompanyUser(req);
      if (!user?.companyId || listing.brand.company.id !== user.companyId) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }
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
router.post('/', requireAuth(), requireRole('admin', 'manufacturer'), async (req, res, next) => {
  try {
    const { role } = getCurrentUser(req);
    const { listing: listingData, skus, images, categoryIds } = req.body;

    const parsedListing = createListingSchema.parse(listingData);

    let listingStatus = parsedListing.status;
    let listingBrandId = parsedListing.brandId;

    if (role === 'manufacturer') {
      // Force draft status for manufacturer-created listings
      listingStatus = 'draft';

      // Verify the brand belongs to the manufacturer's company
      const user = await getCompanyUser(req);
      if (!user?.companyId) {
        res.status(403).json({ error: 'No company associated with your account' });
        return;
      }

      const [brand] = await db
        .select({ companyId: brands.companyId })
        .from(brands)
        .where(and(eq(brands.id, parsedListing.brandId), isNull(brands.deletedAt)));

      if (!brand || brand.companyId !== user.companyId) {
        res.status(400).json({ error: 'Brand does not belong to your company' });
        return;
      }
    }

    // Insert the listing
    const [newListing] = await db
      .insert(brandListings)
      .values({
        name: parsedListing.name,
        description: parsedListing.description,
        brandId: listingBrandId,
        status: listingStatus,
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
          sku: sku.sku,
          upc: sku.upc,
          size: sku.size,
          casePack: sku.casePack,
          casesPerPallet: sku.casesPerPallet,
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
router.patch('/:id', requireAuth(), requireRole('admin', 'manufacturer'), async (req, res, next) => {
  try {
    const { role } = getCurrentUser(req);
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    // Check listing exists and is not deleted
    const [existing] = await db
      .select({
        id: brandListings.id,
        status: brandListings.status,
        brandId: brandListings.brandId,
      })
      .from(brandListings)
      .where(and(eq(brandListings.id, id), notDeleted(brandListings)));

    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Manufacturer-specific checks
    if (role === 'manufacturer') {
      const user = await getCompanyUser(req);
      if (!user?.companyId) {
        res.status(403).json({ error: 'No company associated with your account' });
        return;
      }

      // Verify listing belongs to manufacturer's company
      const [brand] = await db
        .select({ companyId: brands.companyId })
        .from(brands)
        .where(eq(brands.id, existing.brandId));

      if (!brand || brand.companyId !== user.companyId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      // Cannot edit listing while pending approval or active
      if (existing.status === 'pending_approval') {
        res.status(403).json({ error: 'Cannot edit listing while pending approval' });
        return;
      }
      if (existing.status === 'active') {
        res.status(403).json({ error: 'Cannot edit an active listing' });
        return;
      }
    }

    const { listing: listingData, skus, images, categoryIds } = req.body;

    // Update listing fields if provided
    if (listingData && Object.keys(listingData).length > 0) {
      const parsed = updateListingSchema.parse(listingData);

      // Manufacturer cannot change status via PATCH
      const updateValues = role === 'manufacturer'
        ? { ...parsed, status: undefined, updatedAt: new Date() }
        : { ...parsed, updatedAt: new Date() };

      await db
        .update(brandListings)
        .set(updateValues)
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
            sku: sku.sku,
            upc: sku.upc,
            size: sku.size,
            casePack: sku.casePack,
            casesPerPallet: sku.casesPerPallet,
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

// DELETE /:id - Soft delete listing with cascade (admin-only)
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

// ---- Approval Workflow Endpoints ----

// POST /:id/submit - Submit listing for review (manufacturer or admin)
router.post('/:id/submit', requireAuth(), requireRole('admin', 'manufacturer'), async (req, res, next) => {
  try {
    const { role } = getCurrentUser(req);
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    // Verify listing exists and get current status
    const [existing] = await db
      .select({
        id: brandListings.id,
        name: brandListings.name,
        status: brandListings.status,
        brandId: brandListings.brandId,
      })
      .from(brandListings)
      .where(and(eq(brandListings.id, id), notDeleted(brandListings)));

    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Manufacturer: verify listing belongs to their company
    if (role === 'manufacturer') {
      const user = await getCompanyUser(req);
      if (!user?.companyId) {
        res.status(403).json({ error: 'No company associated with your account' });
        return;
      }
      const companyListing = await getListingForCompany(id, user.companyId);
      if (!companyListing) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }
    }

    // Can only submit from draft, rejected, or archived status
    const validSourceStatuses = ['draft', 'rejected', 'archived'];
    if (!validSourceStatuses.includes(existing.status)) {
      res.status(400).json({ error: 'Can only submit listings in draft, rejected, or archived status' });
      return;
    }

    // Optimistic locking: include expected status in WHERE clause
    const [updated] = await db
      .update(brandListings)
      .set({
        status: 'pending_approval',
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(brandListings.id, id),
          inArray(brandListings.status, ['draft', 'rejected', 'archived']),
        ),
      )
      .returning();

    if (!updated) {
      res.status(409).json({ error: 'Listing status has already changed' });
      return;
    }

    // Notify all admin users
    const adminUserIds = await getAdminUserIds();
    await notifyApprovalEvent({
      type: 'listing_submitted',
      listingId: id,
      listingName: existing.name,
      recipientUserIds: adminUserIds,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /:id/approve - Admin approves listing
router.post('/:id/approve', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    // Verify listing exists and check status
    const [existing] = await db
      .select({
        id: brandListings.id,
        name: brandListings.name,
        status: brandListings.status,
        brandId: brandListings.brandId,
      })
      .from(brandListings)
      .where(and(eq(brandListings.id, id), notDeleted(brandListings)));

    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    if (existing.status !== 'pending_approval') {
      res.status(409).json({ error: 'Listing is not pending approval' });
      return;
    }

    // Optimistic locking
    const [updated] = await db
      .update(brandListings)
      .set({
        status: 'active',
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(brandListings.id, id),
          eq(brandListings.status, 'pending_approval'),
        ),
      )
      .returning();

    if (!updated) {
      res.status(409).json({ error: 'Listing has already been processed' });
      return;
    }

    // Notify the manufacturer's company users
    const [brand] = await db
      .select({ companyId: brands.companyId })
      .from(brands)
      .where(eq(brands.id, existing.brandId));

    if (brand) {
      const companyUserIds = await getCompanyUserIds(brand.companyId);
      await notifyApprovalEvent({
        type: 'listing_approved',
        listingId: id,
        listingName: existing.name,
        recipientUserIds: companyUserIds,
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /:id/reject - Admin rejects listing
router.post('/:id/reject', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }

    // Verify listing exists and check status
    const [existing] = await db
      .select({
        id: brandListings.id,
        name: brandListings.name,
        status: brandListings.status,
        brandId: brandListings.brandId,
      })
      .from(brandListings)
      .where(and(eq(brandListings.id, id), notDeleted(brandListings)));

    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    if (existing.status !== 'pending_approval') {
      res.status(409).json({ error: 'Listing is not pending approval' });
      return;
    }

    // Optimistic locking
    const [updated] = await db
      .update(brandListings)
      .set({
        status: 'rejected',
        rejectionReason: reason.trim(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(brandListings.id, id),
          eq(brandListings.status, 'pending_approval'),
        ),
      )
      .returning();

    if (!updated) {
      res.status(409).json({ error: 'Listing has already been processed' });
      return;
    }

    // Notify the manufacturer's company users
    const [brand] = await db
      .select({ companyId: brands.companyId })
      .from(brands)
      .where(eq(brands.id, existing.brandId));

    if (brand) {
      const companyUserIds = await getCompanyUserIds(brand.companyId);
      await notifyApprovalEvent({
        type: 'listing_rejected',
        listingId: id,
        listingName: existing.name,
        recipientUserIds: companyUserIds,
        rejectionReason: reason.trim(),
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /:id/archive - Archive an active listing
router.post('/:id/archive', requireAuth(), requireRole('admin', 'manufacturer'), async (req, res, next) => {
  try {
    const { role } = getCurrentUser(req);
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    // Verify listing exists
    const [existing] = await db
      .select({
        id: brandListings.id,
        status: brandListings.status,
        brandId: brandListings.brandId,
      })
      .from(brandListings)
      .where(and(eq(brandListings.id, id), notDeleted(brandListings)));

    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Manufacturer: verify listing belongs to their company
    if (role === 'manufacturer') {
      const user = await getCompanyUser(req);
      if (!user?.companyId) {
        res.status(403).json({ error: 'No company associated with your account' });
        return;
      }
      const companyListing = await getListingForCompany(id, user.companyId);
      if (!companyListing) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }
    }

    if (existing.status !== 'active') {
      res.status(400).json({ error: 'Can only archive active listings' });
      return;
    }

    // Optimistic locking
    const [updated] = await db
      .update(brandListings)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(brandListings.id, id),
          eq(brandListings.status, 'active'),
        ),
      )
      .returning();

    if (!updated) {
      res.status(409).json({ error: 'Listing status has already changed' });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// POST /:id/revert-to-draft - Revert an archived listing back to draft
router.post('/:id/revert-to-draft', requireAuth(), requireRole('admin', 'manufacturer'), async (req, res, next) => {
  try {
    const { role } = getCurrentUser(req);
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid listing ID' });
      return;
    }

    // Verify listing exists
    const [existing] = await db
      .select({
        id: brandListings.id,
        status: brandListings.status,
        brandId: brandListings.brandId,
      })
      .from(brandListings)
      .where(and(eq(brandListings.id, id), notDeleted(brandListings)));

    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Manufacturer: verify listing belongs to their company
    if (role === 'manufacturer') {
      const user = await getCompanyUser(req);
      if (!user?.companyId) {
        res.status(403).json({ error: 'No company associated with your account' });
        return;
      }
      const companyListing = await getListingForCompany(id, user.companyId);
      if (!companyListing) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }
    }

    if (existing.status !== 'archived') {
      res.status(400).json({ error: 'Can only revert archived listings to draft' });
      return;
    }

    // Optimistic locking
    const [updated] = await db
      .update(brandListings)
      .set({
        status: 'draft',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(brandListings.id, id),
          eq(brandListings.status, 'archived'),
        ),
      )
      .returning();

    if (!updated) {
      res.status(409).json({ error: 'Listing status has already changed' });
      return;
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export { router as listingRouter };
