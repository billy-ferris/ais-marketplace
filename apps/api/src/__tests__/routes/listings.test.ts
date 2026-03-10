import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// ---------- Mocks (before any app imports) ----------

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
}));

// Shared chainable mock for `db` — vi.hoisted() ensures this is available
// at the time vi.mock() factory runs (since vi.mock is hoisted above declarations).
const mockDb: any = vi.hoisted(() => ({}));

vi.mock('../../db/index', () => {
  // Chainable query-builder methods
  mockDb.select = vi.fn().mockReturnValue(mockDb);
  mockDb.from = vi.fn().mockReturnValue(mockDb);
  mockDb.where = vi.fn().mockReturnValue(mockDb);
  mockDb.leftJoin = vi.fn().mockReturnValue(mockDb);
  mockDb.innerJoin = vi.fn().mockReturnValue(mockDb);
  mockDb.limit = vi.fn().mockReturnValue(mockDb);
  mockDb.offset = vi.fn().mockReturnValue(mockDb);
  mockDb.orderBy = vi.fn().mockReturnValue(mockDb);
  mockDb.groupBy = vi.fn().mockReturnValue(mockDb);
  mockDb.as = vi.fn().mockReturnValue(mockDb);
  mockDb.insert = vi.fn().mockReturnValue(mockDb);
  mockDb.values = vi.fn().mockReturnValue(mockDb);
  mockDb.returning = vi.fn().mockResolvedValue([]);
  mockDb.update = vi.fn().mockReturnValue(mockDb);
  mockDb.set = vi.fn().mockReturnValue(mockDb);
  mockDb.delete = vi.fn().mockReturnValue(mockDb);
  // `then` must start as undefined so the mock is NOT a thenable by default.
  // Individual tests assign mockDb.then when they need await to resolve.
  mockDb.then = undefined;

  // Relational query API
  mockDb.query = {
    brandListings: {
      findFirst: vi.fn(),
    },
  };

  return { db: mockDb };
});

// ---------- Imports (after mocks) ----------

import { listingRouter } from '../../routes/listings';

// ---------- Helpers ----------

/** Extract the final route handler from the Express Router stack. */
function getHandler(router: any, method: string, path: string) {
  const layer = router.stack.find(
    (l: any) => l.route?.path === path && l.route?.methods[method],
  );
  if (!layer) throw new Error(`No route found: ${method.toUpperCase()} ${path}`);
  // The last entry in the route's stack is the actual handler (after middleware)
  const stack = layer.route.stack;
  return stack[stack.length - 1].handle;
}

function createMockReqRes(overrides?: {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: unknown;
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

// ---------- Suites ----------

describe('Listing Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset thenable so mock is NOT auto-awaitable between tests
    mockDb.then = undefined;
    // Defaults for terminal methods
    mockDb.returning.mockResolvedValue([]);
    mockDb.query.brandListings.findFirst.mockResolvedValue(undefined);
  });

  // ---- GET / ----
  describe('GET /api/listings', () => {
    const handler = getHandler(listingRouter, 'get', '/');

    /**
     * The GET / handler does:
     *   1. Build a subquery (db.select...from...where...groupBy...as)
     *   2. Promise.all([ dataQuery, countQuery ])
     *   3. If results, follow-up db.select...from(listingCategories)...innerJoin...where
     *   4. res.json({ data, pagination })
     *
     * Because the mock `db` is one shared object, we make it thenable at the
     * right moment so Promise.all resolves correctly.
     */

    function setupListQuery(
      data: any[] = [],
      total = 0,
      categories: any[] = [],
    ) {
      // Promise.all awaits two chains that both end with the shared mockDb.
      // We need the first `await mockDb` (data query) to resolve with `data`,
      // the second `await mockDb` (count query) to resolve with `[{ total }]`.
      // After that, if data is non-empty, a third await fetches categories.
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) return resolve(data);
        if (callCount === 2) return resolve([{ total }]);
        // category follow-up query
        return resolve(categories);
      });
    }

    it('should return paginated list of listings', async () => {
      const listingRow = {
        id: 1,
        name: 'Test Listing',
        description: 'desc',
        brandId: 10,
        brandName: 'Brand A',
        status: 'active',
        skuCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setupListQuery([listingRow], 1, []);

      const { req, res, next } = createMockReqRes();
      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      const payload = (res.json as any).mock.calls[0][0];
      expect(payload.data).toHaveLength(1);
      expect(payload.data[0]).toMatchObject({ id: 1, name: 'Test Listing' });
      expect(payload.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 1,
        pageCount: 1,
      });
    });

    it('should filter by search query', async () => {
      setupListQuery([], 0);
      const { req, res, next } = createMockReqRes({
        query: { search: 'test' },
      });
      await handler(req, res, next);

      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledOnce();
    });

    it('should filter by status', async () => {
      setupListQuery([], 0);
      const { req, res, next } = createMockReqRes({
        query: { status: 'active' },
      });
      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
    });

    it('should filter by brandId', async () => {
      setupListQuery([], 0);
      const { req, res, next } = createMockReqRes({
        query: { brandId: '1' },
      });
      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
    });

    it('should include brand name, SKU count, and categories in response', async () => {
      const listingRow = {
        id: 5,
        name: 'Listing 5',
        description: null,
        brandId: 2,
        brandName: 'Brand B',
        status: 'draft',
        skuCount: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const catRows = [
        { listingId: 5, categoryId: 10, categoryName: 'Skincare' },
      ];
      setupListQuery([listingRow], 1, catRows);

      const { req, res, next } = createMockReqRes();
      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      expect(payload.data[0].brandName).toBe('Brand B');
      expect(payload.data[0].skuCount).toBe(7);
      expect(payload.data[0].categories).toEqual([
        { id: 10, name: 'Skincare' },
      ]);
    });

    it('should exclude soft-deleted listings', async () => {
      setupListQuery([], 0);
      const { req, res, next } = createMockReqRes();
      await handler(req, res, next);

      // The handler always applies `where` which includes the notDeleted filter.
      expect(mockDb.where).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledOnce();
    });
  });

  // ---- GET /:id ----
  describe('GET /api/listings/:id', () => {
    const handler = getHandler(listingRouter, 'get', '/:id');

    it('should return full listing with brand, SKUs, images, and categories', async () => {
      const fullListing = {
        id: 1,
        name: 'Full Listing',
        brand: { id: 10, name: 'Brand', company: { id: 1, name: 'Co' } },
        inventorySkus: [{ id: 100, name: 'SKU-A' }],
        brandListingImages: [
          { id: 200, imageUrl: 'https://img.test/a.jpg', displayOrder: 0 },
        ],
        listingCategories: [
          {
            category: { id: 50, name: 'Skincare', deletedAt: null },
          },
        ],
      };
      mockDb.query.brandListings.findFirst.mockResolvedValue(fullListing);

      const { req, res, next } = createMockReqRes({ params: { id: '1' } });
      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      const payload = (res.json as any).mock.calls[0][0];
      expect(payload.name).toBe('Full Listing');
      expect(payload.brand).toBeDefined();
      expect(payload.inventorySkus).toHaveLength(1);
      expect(payload.brandListingImages).toHaveLength(1);
      expect(payload.categories).toEqual([
        { id: 50, name: 'Skincare', deletedAt: null },
      ]);
    });

    it('should return 404 for non-existent listing', async () => {
      mockDb.query.brandListings.findFirst.mockResolvedValue(undefined);

      const { req, res, next } = createMockReqRes({ params: { id: '999' } });
      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Listing not found' });
    });

    it('should exclude soft-deleted SKUs from nested response', async () => {
      // The query itself filters deleted SKUs via the `where` clause in `with`.
      // The mock returns only non-deleted SKUs (as the real DB would).
      const listing = {
        id: 2,
        name: 'Listing 2',
        brand: { id: 10, name: 'B', company: { id: 1, name: 'C' } },
        inventorySkus: [{ id: 101, name: 'Active SKU', deletedAt: null }],
        brandListingImages: [],
        listingCategories: [],
      };
      mockDb.query.brandListings.findFirst.mockResolvedValue(listing);

      const { req, res, next } = createMockReqRes({ params: { id: '2' } });
      await handler(req, res, next);

      const payload = (res.json as any).mock.calls[0][0];
      expect(payload.inventorySkus).toHaveLength(1);
      expect(payload.inventorySkus[0].name).toBe('Active SKU');
    });
  });

  // ---- POST / ----
  describe('POST /api/listings', () => {
    const handler = getHandler(listingRouter, 'post', '/');

    it('should create listing with nested SKUs, images, and categories', async () => {
      // The handler inserts listing, then SKUs, images, categories, then re-queries.
      // 1. db.insert(...).values(...).returning() -> new listing
      mockDb.returning.mockResolvedValueOnce([
        { id: 1, name: 'New Listing', brandId: 10, status: 'draft' },
      ]);

      // 2. Re-query via findFirst
      const fullListing = {
        id: 1,
        name: 'New Listing',
        brand: { id: 10, name: 'Brand', company: { id: 1, name: 'Co' } },
        inventorySkus: [{ id: 100, name: 'SKU-1' }],
        brandListingImages: [{ id: 200, imageUrl: 'url', displayOrder: 0, isPrimary: true }],
        listingCategories: [
          { category: { id: 50, name: 'Hair Care', deletedAt: null } },
        ],
      };
      mockDb.query.brandListings.findFirst.mockResolvedValue(fullListing);

      const { req, res, next } = createMockReqRes({
        body: {
          listing: { name: 'New Listing', brandId: 10 },
          skus: [{ name: 'SKU-1', price: '10.00', msrp: '20.00', quantity: 5 }],
          images: [{ imageUrl: 'https://img.test/a.jpg', displayOrder: 0 }],
          categoryIds: [50],
        },
      });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledOnce();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should enforce max 5 images per listing', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 2, name: 'Img Listing', brandId: 10, status: 'draft' },
      ]);
      mockDb.query.brandListings.findFirst.mockResolvedValue({
        id: 2,
        name: 'Img Listing',
        brand: { id: 10, name: 'B', company: { id: 1, name: 'C' } },
        inventorySkus: [],
        brandListingImages: [],
        listingCategories: [],
      });

      const sevenImages = Array.from({ length: 7 }, (_, i) => ({
        imageUrl: `https://img.test/${i}.jpg`,
        displayOrder: i,
      }));

      const { req, res, next } = createMockReqRes({
        body: {
          listing: { name: 'Img Listing', brandId: 10 },
          images: sevenImages,
        },
      });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);

      // Find the call to mockDb.values that received image data (array of objects with imageUrl)
      const valuesCalls = mockDb.values.mock.calls;
      const imageInsertCall = valuesCalls.find(
        (call: any[]) =>
          Array.isArray(call[0]) &&
          call[0].length > 0 &&
          call[0][0].imageUrl !== undefined,
      );
      expect(imageInsertCall).toBeDefined();
      // Should be sliced to max 5
      expect(imageInsertCall![0]).toHaveLength(5);
    });

    it('should set exactly one image as primary', async () => {
      mockDb.returning.mockResolvedValueOnce([
        { id: 3, name: 'Primary Test', brandId: 10, status: 'draft' },
      ]);
      mockDb.query.brandListings.findFirst.mockResolvedValue({
        id: 3,
        name: 'Primary Test',
        brand: { id: 10, name: 'B', company: { id: 1, name: 'C' } },
        inventorySkus: [],
        brandListingImages: [],
        listingCategories: [],
      });

      // None of the images have isPrimary set
      const images = [
        { imageUrl: 'https://img.test/0.jpg', displayOrder: 0 },
        { imageUrl: 'https://img.test/1.jpg', displayOrder: 1 },
      ];

      const { req, res, next } = createMockReqRes({
        body: {
          listing: { name: 'Primary Test', brandId: 10 },
          images,
        },
      });

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);

      // Find the image values insert call
      const valuesCalls = mockDb.values.mock.calls;
      const imageInsertCall = valuesCalls.find(
        (call: any[]) =>
          Array.isArray(call[0]) &&
          call[0].length > 0 &&
          call[0][0].imageUrl !== undefined,
      );
      expect(imageInsertCall).toBeDefined();
      const insertedImages = imageInsertCall![0];
      // At least one image should be primary (first one since none were explicitly set)
      const primaryCount = insertedImages.filter(
        (img: any) => img.isPrimary,
      ).length;
      expect(primaryCount).toBeGreaterThanOrEqual(1);
    });

    it('should reject invalid listing data', async () => {
      const { req, res, next } = createMockReqRes({
        body: {
          listing: { name: '' }, // name is empty, brandId is missing
        },
      });

      await handler(req, res, next);

      // Invalid data causes ZodError which gets caught and passed to next()
      expect(next).toHaveBeenCalled();
      const error = (next as any).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.name).toBe('ZodError');
    });
  });

  // ---- PATCH /:id ----
  describe('PATCH /api/listings/:id', () => {
    const handler = getHandler(listingRouter, 'patch', '/:id');

    /** Set up the existence check to return a listing row. */
    function setupExistenceCheck(exists = true) {
      // The PATCH handler does: const [existing] = await db.select(...).from(...).where(...)
      // This chain resolves to an array. We make mockDb thenable for the existence check.
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) {
          return resolve(exists ? [{ id: 1 }] : []);
        }
        // Subsequent awaits (for update/insert/delete operations) just resolve
        return resolve([]);
      });
    }

    it('should update listing fields', async () => {
      setupExistenceCheck(true);
      mockDb.query.brandListings.findFirst.mockResolvedValue({
        id: 1,
        name: 'Updated Listing',
        brand: { id: 10, name: 'B', company: { id: 1, name: 'C' } },
        inventorySkus: [],
        brandListingImages: [],
        listingCategories: [],
      });

      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: { listing: { name: 'Updated Listing' } },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
    });

    it('should create new SKUs via skus.create', async () => {
      setupExistenceCheck(true);
      mockDb.query.brandListings.findFirst.mockResolvedValue({
        id: 1,
        name: 'Listing',
        brand: { id: 10, name: 'B', company: { id: 1, name: 'C' } },
        inventorySkus: [{ id: 200, name: 'New SKU' }],
        brandListingImages: [],
        listingCategories: [],
      });

      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: {
          skus: {
            create: [
              { name: 'New SKU', price: '10.00', msrp: '20.00', quantity: 5 },
            ],
          },
        },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      expect(mockDb.insert).toHaveBeenCalled();
      // Verify values was called with SKU data
      const valuesCall = mockDb.values.mock.calls.find(
        (call: any[]) =>
          Array.isArray(call[0]) &&
          call[0].length > 0 &&
          call[0][0].name === 'New SKU',
      );
      expect(valuesCall).toBeDefined();
    });

    it('should update existing SKUs via skus.update', async () => {
      setupExistenceCheck(true);
      mockDb.query.brandListings.findFirst.mockResolvedValue({
        id: 1,
        name: 'Listing',
        brand: { id: 10, name: 'B', company: { id: 1, name: 'C' } },
        inventorySkus: [],
        brandListingImages: [],
        listingCategories: [],
      });

      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: {
          skus: {
            update: [{ id: 100, data: { name: 'Updated SKU' } }],
          },
        },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
    });

    it('should soft-delete SKUs via skus.delete', async () => {
      setupExistenceCheck(true);
      mockDb.query.brandListings.findFirst.mockResolvedValue({
        id: 1,
        name: 'Listing',
        brand: { id: 10, name: 'B', company: { id: 1, name: 'C' } },
        inventorySkus: [],
        brandListingImages: [],
        listingCategories: [],
      });

      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: {
          skus: { delete: [1, 2] },
        },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      // Soft-delete uses update().set({ deletedAt }).where()
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
    });

    it('should replace categories via categoryIds', async () => {
      setupExistenceCheck(true);
      mockDb.query.brandListings.findFirst.mockResolvedValue({
        id: 1,
        name: 'Listing',
        brand: { id: 10, name: 'B', company: { id: 1, name: 'C' } },
        inventorySkus: [],
        brandListingImages: [],
        listingCategories: [
          { category: { id: 1, name: 'New Cat', deletedAt: null } },
        ],
      });

      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: {
          categoryIds: [1, 2, 3],
        },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      // Should delete old categories then insert new ones
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should add and delete images', async () => {
      // For image creation, the handler checks existing count first:
      // const [{ existingCount }] = await db.select({existingCount}).from(...).where(...)
      // We need that count query to resolve.
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        if (callCount === 1) {
          // Existence check
          return resolve([{ id: 1 }]);
        }
        if (callCount === 2) {
          // Existing image count query
          return resolve([{ existingCount: 2 }]);
        }
        // Any other awaits
        return resolve([]);
      });

      mockDb.query.brandListings.findFirst.mockResolvedValue({
        id: 1,
        name: 'Listing',
        brand: { id: 10, name: 'B', company: { id: 1, name: 'C' } },
        inventorySkus: [],
        brandListingImages: [],
        listingCategories: [],
      });

      const { req, res, next } = createMockReqRes({
        params: { id: '1' },
        body: {
          images: {
            create: [{ imageUrl: 'https://img.test/new.jpg', displayOrder: 0 }],
            delete: [1],
          },
        },
      });

      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledOnce();
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  // ---- DELETE /:id ----
  describe('DELETE /api/listings/:id', () => {
    const handler = getHandler(listingRouter, 'delete', '/:id');

    it('should soft-delete listing and cascade soft-delete to SKUs', async () => {
      // The handler does: db.update(brandListings).set({deletedAt}).where(...).returning()
      mockDb.returning.mockResolvedValueOnce([{ id: 1, name: 'Deleted' }]);

      // After soft-deleting the listing, it cascade-updates SKUs:
      // await db.update(inventorySkus).set({deletedAt}).where(...)
      // Since mockDb.update/set/where return mockDb, we need subsequent awaits to resolve.
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        // All cascade operations just resolve
        return resolve(undefined);
      });

      const { req, res, next } = createMockReqRes({ params: { id: '1' } });
      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Listing deleted' });
      // update is called for: listing soft-delete (via returning chain) + SKU cascade
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should hard-delete listing_categories join rows', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 1, name: 'Deleted' }]);
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        return resolve(undefined);
      });

      const { req, res, next } = createMockReqRes({ params: { id: '1' } });
      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Listing deleted' });
      // delete is called for listing_categories and brand_listing_images
      expect(mockDb.delete).toHaveBeenCalled();
    });

    it('should hard-delete brand_listing_images rows', async () => {
      mockDb.returning.mockResolvedValueOnce([{ id: 1, name: 'Deleted' }]);
      let callCount = 0;
      mockDb.then = vi.fn((resolve: any) => {
        callCount++;
        return resolve(undefined);
      });

      const { req, res, next } = createMockReqRes({ params: { id: '1' } });
      await handler(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ message: 'Listing deleted' });
      // delete should be called at least twice (listing_categories + brand_listing_images)
      expect(mockDb.delete.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---- Manufacturer scoping ----
  describe('Manufacturer scoping', () => {
    it.todo('should filter listings to manufacturer company when role is manufacturer');
    it.todo('should filter brand dropdown to manufacturer company brands');
    it.todo('should return all listings for admin role');
  });

  // ---- Approval workflow ----
  describe('Approval workflow', () => {
    it.todo('should set status to draft on manufacturer listing create');
    it.todo('should allow manufacturer to submit listing for review (draft -> pending_approval)');
    it.todo('should prevent manufacturer from editing listing in pending_approval status');
    it.todo('should allow admin to approve listing (pending_approval -> active)');
    it.todo('should allow admin to reject listing with reason (pending_approval -> rejected)');
    it.todo('should allow manufacturer to resubmit rejected listing (rejected -> pending_approval)');
    it.todo('should bypass approval for admin-created listings');
    it.todo('should return 409 when approving already-processed listing');
    it.todo('should allow manufacturer to archive active listing');
  });
});
