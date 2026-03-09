# Phase 2: Admin Catalog Management - Research

**Researched:** 2026-03-08
**Domain:** Admin CRUD interfaces for brands, categories, and inventory listings with image uploads to Cloudflare R2
**Confidence:** HIGH

## Summary

Phase 2 builds the admin catalog management system: database tables for brands, categories, and inventory listings (Brand -> BrandListing -> InventorySKU hierarchy), CRUD APIs on Express, and admin UI pages using shadcn/ui data tables and forms. The frontend needs client-side routing (react-router v7), server state management (TanStack Query v5), and form handling (react-hook-form + Zod). Image uploads use presigned URLs from Cloudflare R2 via the AWS SDK v3 S3-compatible API.

The existing codebase provides strong templates to follow. The companies route (`apps/api/src/routes/companies.ts`) establishes the exact Express CRUD pattern with `requireAuth()` + `requireRole('admin')`. The shared package schema pattern (`packages/shared/src/schemas/company.ts`) shows Zod validation with `createXSchema` + `updateXSchema = createXSchema.partial()`. The Drizzle schema pattern (`apps/api/src/db/schema/companies.ts`) with `pgEnum`, `integer().primaryKey().generatedAlwaysAsIdentity()`, and `timestamp('created_at').defaultNow()` is the model for all new tables.

**Primary recommendation:** Follow the established patterns exactly -- new tables in `apps/api/src/db/schema/`, new routes mirroring `companies.ts`, new Zod schemas in `packages/shared/src/schemas/`, and new pages under `apps/web/src/pages/manage/`. Install react-router, TanStack Query, TanStack Table, react-hook-form, and sonner to support the admin UI.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Custom shadcn/ui pages -- no React-Admin or other admin framework
- Separate pages for each entity: /manage/brands, /manage/categories, /manage/listings
- Sidebar "Manage" item expands into sub-nav items (Brands, Categories, Listings)
- Brands and categories use dialog modals for create/edit (few fields)
- Listings use dedicated create/edit pages (many fields -- images, SKUs, pricing)
- Cloudflare R2 for image storage, URLs stored in PostgreSQL
- Direct browser upload via presigned URLs (API generates URL, browser uploads to R2)
- BrandListings: multiple images (up to 5) with a designated primary/hero image, admin can reorder
- InventorySKUs: single product image per SKU
- Brands: single logo image upload
- Categories: no image -- use Lucide icons
- All images optional with placeholder fallback for demo velocity
- Hierarchy: Brand -> BrandListing -> InventorySKU
- Brand belongs to a company (manufacturer) via companyId
- BrandListing status enum: draft, active, sold_out, archived
- Many-to-many relationship between listings and categories via join table (listing_categories)
- CPG categories pre-seeded but admin can edit/add more
- Data tables for all list views (sortable, searchable, with inline action buttons per row)
- Soft delete with confirmation dialog (deletedAt timestamp, not hard delete)
- SKUs added inline on the listing create/edit page (not a separate page)
- Search bar + filter dropdowns on each management table
- Server-side filtering via API query params

### Claude's Discretion
- Exact table column selection and sort defaults
- Form field layout and validation UX
- Presigned URL expiration and R2 bucket configuration
- Pagination approach for tables (offset vs cursor)
- Loading states and error handling patterns
- shadcn/ui component selection (which specific components to install)

### Deferred Ideas (OUT OF SCOPE)
- Negotiation potential indicator (Low/Med/High) on listings -- v2 (CATL-06)
- Geographic restrictions and retail restrictions on listings -- v2 (CATL-07)
- FOB/Ship From location on listings -- v2 (CATL-07)
- Hero/featured listing curation -- Phase 3 (CATL-05)
- Manufacturer self-serve inventory upload -- v2 (MFPR-04)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMN-01 | Admin can create, edit, and delete inventory listings | Drizzle schema for brands/brand_listings/inventory_skus/listing_categories tables, Express CRUD routes with requireAuth+requireRole, Zod validation schemas, shadcn/ui form pages with react-hook-form, TanStack Query mutations with cache invalidation, R2 presigned URL image upload pipeline, soft delete pattern |
| ADMN-02 | Admin can manage brands and categories | Drizzle schema for brands/categories tables, Express CRUD routes, Zod validation schemas, shadcn/ui dialog modals for create/edit, data tables with sorting/filtering/search, seed data for CPG categories |
</phase_requirements>

## Standard Stack

### Core (New Dependencies for Phase 2)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-router | 7.x | Client-side routing | Phase 1 has no routing (single dashboard view). Phase 2 needs /manage/brands, /manage/categories, /manage/listings, /manage/listings/new, /manage/listings/:id/edit. React Router v7 is the standard; import from "react-router" (not "react-router-dom"). |
| @tanstack/react-query | 5.x | Server state management | Smart caching, background refetching, mutation + query invalidation for CRUD operations. All admin data fetching goes through query hooks. |
| @tanstack/react-table | 8.x | Headless data table engine | Powers all three management tables (brands, categories, listings). Sorting, filtering, pagination, column visibility. shadcn/ui Data Table wraps this. |
| react-hook-form | 7.x | Form state management | Listing create/edit forms with many fields. Minimal re-renders, native validation. Paired with Zod via @hookform/resolvers. |
| @hookform/resolvers | 5.x | Form-to-schema bridge | Connects Zod 3.x schemas to React Hook Form. `resolver: zodResolver(schema)`. |
| sonner | 2.x | Toast notifications | Success/error toasts for CRUD operations ("Brand created", "Listing deleted"). shadcn/ui has a Sonner integration component. |
| @aws-sdk/client-s3 | 3.x | S3 client for R2 | Cloudflare R2 uses S3-compatible API. Server-side only (API app) for generating presigned URLs. |
| @aws-sdk/s3-request-presigner | 3.x | Presigned URL generation | `getSignedUrl()` creates time-limited upload URLs. Server-side only. |

### Supporting (Already Installed)

| Library | Version | Purpose | Phase 2 Role |
|---------|---------|---------|-------------|
| zod | 3.x | Schema validation | Shared validation schemas for brand, category, listing, SKU create/update operations |
| drizzle-orm | 0.45.x | Database ORM | New table definitions for brands, categories, brand_listings, inventory_skus, listing_categories, brand_listing_images |
| lucide-react | 0.577.x | Icon library | Category icons, table action icons, form field icons |
| shadcn/ui | Latest | UI components | Data Table, Dialog, Form, Select, Textarea, DropdownMenu, Label, Tabs (to be installed via CLI) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-router v7 | TanStack Router | TanStack Router has better type safety but smaller ecosystem. React Router v7 is simpler to adopt and more widely documented. |
| Offset pagination | Cursor pagination | Offset is simpler for admin tables with moderate data sizes. Cursor is better for infinite scroll or large datasets. Offset recommended for Phase 2 admin views. |
| Presigned URL upload | Multipart form through API | Presigned URLs bypass the API server for actual file transfer, reducing server load. Multipart is simpler but means files pass through Express. User decision locked presigned URLs. |

**Installation (API app):**
```bash
cd apps/api
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Installation (Web app):**
```bash
cd apps/web
pnpm add react-router @tanstack/react-query @tanstack/react-table react-hook-form @hookform/resolvers sonner
pnpm add -D @tanstack/react-query-devtools
```

**shadcn/ui components to install (Web app):**
```bash
cd apps/web
npx shadcn@latest add table dialog select textarea dropdown-menu label tabs sonner form alert-dialog switch
```

## Architecture Patterns

### Recommended Project Structure (New files for Phase 2)

```
apps/api/src/
  db/schema/
    brands.ts                  # Brand table + pgEnum
    categories.ts              # Categories table
    brand-listings.ts          # BrandListing table + status enum
    inventory-skus.ts          # InventorySKU table
    listing-categories.ts      # Join table (many-to-many)
    brand-listing-images.ts    # Listing images table (up to 5 per listing)
    relations.ts               # Extended with all new relations
    index.ts                   # Extended barrel exports
  routes/
    brands.ts                  # Brand CRUD routes
    categories.ts              # Category CRUD routes
    listings.ts                # BrandListing CRUD routes (includes SKU management)
    uploads.ts                 # Presigned URL generation endpoint
  db/seed.ts                   # Extended with brands, categories, sample listings

packages/shared/src/
  schemas/
    brand.ts                   # createBrandSchema, updateBrandSchema
    category.ts                # createCategorySchema, updateCategorySchema
    listing.ts                 # createListingSchema, updateListingSchema
    inventory-sku.ts           # createSkuSchema, updateSkuSchema
    index.ts                   # Extended barrel exports
  types/
    brand.ts                   # Brand, BrandListing, InventorySKU interfaces
    catalog.ts                 # ListingStatus, CategoryWithIcon types
    index.ts                   # Extended barrel exports
  constants/
    routes.ts                  # Extended API_ROUTES with new endpoints
    catalog.ts                 # ListingStatus const object, CPG_CATEGORIES seed list
    index.ts                   # Extended barrel exports

apps/web/src/
  pages/
    manage/
      BrandsPage.tsx           # Data table + dialog create/edit
      CategoriesPage.tsx       # Data table + dialog create/edit
      ListingsPage.tsx         # Data table with filters
      ListingCreatePage.tsx    # Full form page with inline SKUs
      ListingEditPage.tsx      # Full form page (pre-populated)
  hooks/
    useBrands.ts               # TanStack Query hooks for brand CRUD
    useCategories.ts           # TanStack Query hooks for category CRUD
    useListings.ts             # TanStack Query hooks for listing CRUD
    useUpload.ts               # Presigned URL fetch + browser upload hook
  components/
    manage/
      BrandDialog.tsx          # Create/edit brand dialog with form
      CategoryDialog.tsx       # Create/edit category dialog with form
      ListingForm.tsx          # Shared create/edit form component
      SkuInlineEditor.tsx      # Inline SKU add/edit within listing form
      ImageUploader.tsx        # Reusable image upload component
      DataTableToolbar.tsx     # Search + filter bar for data tables
      columns/
        brand-columns.tsx      # TanStack Table column defs for brands
        category-columns.tsx   # TanStack Table column defs for categories
        listing-columns.tsx    # TanStack Table column defs for listings
    shared/
      DataTable.tsx            # Reusable shadcn data table wrapper
      ConfirmDeleteDialog.tsx  # Soft delete confirmation dialog
      ImagePlaceholder.tsx     # Placeholder for missing images
```

### Pattern 1: Express CRUD Route (Following companies.ts)

**What:** Standard admin-only CRUD route with Zod validation, soft delete, and query filtering.
**When to use:** Every new entity route (brands, categories, listings).
**Example:**
```typescript
// Source: Existing pattern in apps/api/src/routes/companies.ts
import { Router, type Router as RouterType } from 'express';
import { eq, and, isNull, ilike } from 'drizzle-orm';
import { db } from '../db/index';
import { brands } from '../db/schema/index';
import { createBrandSchema, updateBrandSchema } from '@ais/shared/schemas';
import { requireAuth, requireRole } from '../middleware/auth';

const router: RouterType = Router();

// GET / - List brands (with search/filter, exclude soft-deleted)
router.get('/', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const conditions = [isNull(brands.deletedAt)];
    if (search) conditions.push(ilike(brands.name, `%${search}%`));

    const result = await db.select().from(brands)
      .where(and(...conditions))
      .limit(Number(limit))
      .offset((Number(page) - 1) * Number(limit));
    res.json(result);
  } catch (err) { next(err); }
});

// POST / - Create brand
router.post('/', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const data = createBrandSchema.parse(req.body);
    const [brand] = await db.insert(brands).values(data).returning();
    res.status(201).json(brand);
  } catch (err) { next(err); }
});

// PATCH /:id - Update brand
router.patch('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = updateBrandSchema.parse(req.body);
    const [brand] = await db.update(brands)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(brands.id, id), isNull(brands.deletedAt)))
      .returning();
    if (!brand) { res.status(404).json({ error: 'Brand not found' }); return; }
    res.json(brand);
  } catch (err) { next(err); }
});

// DELETE /:id - Soft delete brand
router.delete('/:id', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [brand] = await db.update(brands)
      .set({ deletedAt: new Date() })
      .where(and(eq(brands.id, id), isNull(brands.deletedAt)))
      .returning();
    if (!brand) { res.status(404).json({ error: 'Brand not found' }); return; }
    res.json(brand);
  } catch (err) { next(err); }
});
```

### Pattern 2: TanStack Query CRUD Hooks

**What:** Query + mutation hooks with cache invalidation for admin CRUD.
**When to use:** Every admin entity on the frontend.
**Example:**
```typescript
// Source: TanStack Query v5 docs - mutations + invalidation
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { API_ROUTES } from '@ais/shared';

export function useBrands(params?: { search?: string; page?: number }) {
  return useQuery({
    queryKey: ['brands', params],
    queryFn: () => apiFetch(`${API_ROUTES.BRANDS}?${new URLSearchParams(
      Object.entries(params ?? {}).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    )}`),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBrandInput) =>
      apiFetch(API_ROUTES.BRANDS, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${API_ROUTES.BRANDS}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}
```

### Pattern 3: Presigned URL Upload Flow

**What:** API generates presigned URL, browser uploads directly to R2, then saves URL to DB.
**When to use:** All image uploads (brand logo, listing images, SKU images).
**Example:**
```typescript
// Server side: apps/api/src/routes/uploads.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// POST /api/uploads/presigned-url
router.post('/presigned-url', requireAuth(), requireRole('admin'), async (req, res, next) => {
  try {
    const { fileName, contentType } = req.body;
    const key = `images/${Date.now()}-${fileName}`;
    const url = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 }, // 10 minutes
    );
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    res.json({ uploadUrl: url, publicUrl, key });
  } catch (err) { next(err); }
});
```

```typescript
// Client side: apps/web/src/hooks/useUpload.ts
export function useUpload() {
  const getPresignedUrl = useMutation({
    mutationFn: async ({ fileName, contentType }: { fileName: string; contentType: string }) =>
      apiFetch<{ uploadUrl: string; publicUrl: string; key: string }>(
        `${API_ROUTES.UPLOADS}/presigned-url`,
        { method: 'POST', body: JSON.stringify({ fileName, contentType }) }
      ),
  });

  const uploadFile = async (file: File) => {
    const { uploadUrl, publicUrl } = await getPresignedUrl.mutateAsync({
      fileName: file.name,
      contentType: file.type,
    });
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    return publicUrl;
  };

  return { uploadFile, isUploading: getPresignedUrl.isPending };
}
```

### Pattern 4: Dialog Modal Form (Brands/Categories)

**What:** shadcn Dialog with embedded react-hook-form for entities with few fields.
**When to use:** Brand create/edit and category create/edit.
**Example:**
```typescript
// Source: shadcn/ui Dialog + Form documentation
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function BrandDialog({ open, onOpenChange, brand }: BrandDialogProps) {
  const form = useForm({
    resolver: zodResolver(createBrandSchema),
    defaultValues: brand ?? { name: '', companyId: undefined },
  });

  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();

  const onSubmit = (data: CreateBrandInput) => {
    const mutation = brand ? updateBrand : createBrand;
    mutation.mutate(brand ? { id: brand.id, ...data } : data, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(brand ? 'Brand updated' : 'Brand created');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{brand ? 'Edit' : 'Create'} Brand</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {/* more fields */}
            <DialogFooter>
              <Button type="submit" disabled={createBrand.isPending || updateBrand.isPending}>
                {brand ? 'Save Changes' : 'Create Brand'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Pattern 5: React Router Setup (SPA Mode)

**What:** React Router v7 with createBrowserRouter for client-side routing in Vite SPA.
**When to use:** App root setup, replacing the current single-view DashboardLayout.
**Example:**
```typescript
// Source: React Router v7 docs - Data mode SPA
import { createBrowserRouter, RouterProvider } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardLayout /> },
      {
        path: 'manage',
        children: [
          { path: 'brands', element: <BrandsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'listings', element: <ListingsPage /> },
          { path: 'listings/new', element: <ListingCreatePage /> },
          { path: 'listings/:id/edit', element: <ListingEditPage /> },
        ],
      },
    ],
  },
]);

// In App.tsx, wrap with RouterProvider
<Show when="signed-in">
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
    <Toaster />
  </QueryClientProvider>
</Show>
```

### Anti-Patterns to Avoid

- **Hard delete instead of soft delete:** Use `deletedAt` timestamp, never `DELETE FROM`. Future phases reference brands/listings in orders/offers, and hard deletes break foreign key integrity.
- **Fetching without TanStack Query:** Do not use `useEffect` + `useState` for API calls. TanStack Query provides caching, deduplication, and automatic background refetching.
- **Uploading files through the API server:** The API only generates presigned URLs. File bytes go directly from the browser to R2. Never pipe file buffers through Express.
- **Mixing Drizzle schema and relations in the same file:** Keep relations in `relations.ts` per established pattern. Schema files define tables only.
- **Building custom table/sort/filter logic:** Use TanStack Table's built-in `getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`. Never hand-roll sort/filter state management.
- **Using TS enums:** Follow the const object pattern (`as const`) established in the project for `UserRole`, `CompanyType`. New enums like `ListingStatus` follow the same pattern.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data table with sorting/filtering/pagination | Custom table component with manual state | shadcn/ui Data Table + TanStack Table v8 | Keyboard navigation, column resizing, row selection, stable sort -- hundreds of edge cases. |
| Form validation + error display | Manual validation in submit handler | react-hook-form + Zod + shadcn Form components | Field-level errors, async validation, dirty tracking, controlled/uncontrolled flexibility. |
| Server state caching | useEffect + useState + manual refetch | TanStack Query | Cache invalidation, background refetch, deduplication, retry logic, devtools. |
| Toast notifications | Custom toast component with portal | sonner (via shadcn/ui Sonner) | Accessible, animated, stackable, auto-dismiss. |
| File upload to cloud storage | Multer upload through Express | Presigned URL + browser direct upload to R2 | Offloads bandwidth and processing from API server. No file size limits on Express. |
| Client-side routing | Conditional rendering based on state | React Router v7 createBrowserRouter | URL-based navigation, browser back/forward, deep linking, code splitting. |
| Confirmation dialogs | Window.confirm() or custom modal | shadcn AlertDialog | Accessible, animated, consistent with design system. |

**Key insight:** Admin CRUD interfaces are deceptively complex. Every table needs sorting, filtering, pagination, loading states, empty states, and error states. Every form needs validation, error display, dirty tracking, and submission states. Every delete needs confirmation. Libraries handle all of this; hand-rolling any of it leads to inconsistent UX and bugs.

## Common Pitfalls

### Pitfall 1: Forgetting soft-delete filter in queries
**What goes wrong:** Queries return deleted records, showing "ghost" entries in admin tables.
**Why it happens:** Soft delete requires adding `isNull(table.deletedAt)` to EVERY query, and it is easy to forget.
**How to avoid:** Create a helper function `notDeleted(table)` that returns `isNull(table.deletedAt)` and use it consistently. Add it as the first condition in every WHERE clause.
**Warning signs:** Deleted items reappearing in list views.

### Pitfall 2: Content-Type mismatch on presigned URL upload
**What goes wrong:** Browser upload to R2 fails with `403 SignatureDoesNotMatch`.
**Why it happens:** The Content-Type specified when generating the presigned URL must exactly match the Content-Type header sent by the browser on PUT. If the browser sends a different Content-Type (or none), the signature validation fails.
**How to avoid:** Always pass `ContentType` in `PutObjectCommand` parameters, and always set the same `Content-Type` header in the browser's `fetch` call. Use `file.type` from the File API for both.
**Warning signs:** Upload works in Postman but fails from browser.

### Pitfall 3: R2 CORS not configured
**What goes wrong:** Browser upload fails with CORS error even though presigned URL is valid.
**Why it happens:** R2 buckets require explicit CORS configuration to allow browser PUT requests from your frontend origin.
**How to avoid:** Configure CORS on the R2 bucket before implementing uploads: allow PUT from frontend origin, allow Content-Type header, expose ETag.
**Warning signs:** "Access-Control-Allow-Origin" error in browser console during upload.

### Pitfall 4: React Router breaking existing dashboard
**What goes wrong:** Adding React Router causes the current conditional dashboard rendering to break because the existing `DashboardLayout` pattern uses `useRole()` to switch views, not URL-based routing.
**Why it happens:** The current app has no router -- it renders AdminDashboard/ManufacturerDashboard/RetailerDashboard based on role in `DashboardLayout.tsx`. Adding React Router requires restructuring this to be URL-based.
**How to avoid:** The index route (`/`) should render the existing `DashboardLayout` component, preserving the current role-based switching behavior. Only add new routes for manage pages. Update `AppSidebar` nav items to use React Router `<Link>` components instead of plain buttons.
**Warning signs:** Dashboard disappears or shows wrong content after adding router.

### Pitfall 5: TanStack Query cache key collisions
**What goes wrong:** Editing a brand invalidates listing queries, or table filters don't work because all queries share the same key.
**Why it happens:** Query keys that are too generic (e.g., just `['brands']`) invalidate all brand queries when you only want to invalidate the list, not the individual brand detail.
**How to avoid:** Use structured query keys: `['brands', 'list', { search, page }]` for lists and `['brands', 'detail', id]` for individual records. Invalidate with `{ queryKey: ['brands'] }` to invalidate all brand queries after mutations.
**Warning signs:** Unnecessary refetches, stale data in detail views.

### Pitfall 6: Many-to-many join table foreign key cascades
**What goes wrong:** Deleting a category or listing fails because the join table `listing_categories` still references them.
**Why it happens:** Foreign keys in the join table prevent deletion without ON DELETE CASCADE or explicit cleanup.
**How to avoid:** Since we use soft delete, the join table rows should remain intact. But if a listing is soft-deleted, ensure queries that join through `listing_categories` also check the listing's `deletedAt`. When a category is soft-deleted, listing queries should exclude that category from their categories list.
**Warning signs:** 500 errors on delete, or "ghost" categories appearing on listings.

### Pitfall 7: Express Router type annotation in pnpm strict mode
**What goes wrong:** TypeScript error TS2742 when exporting router from a route file.
**Why it happens:** pnpm strict mode cannot resolve the Express Router type from the re-exported module.
**How to avoid:** Always use `const router: RouterType = Router()` with `import { Router, type Router as RouterType } from 'express'` -- this is already the pattern in `companies.ts`.
**Warning signs:** TS2742 error during build.

## Code Examples

### Drizzle Schema: Brand Table with Soft Delete
```typescript
// Source: Existing pattern from apps/api/src/db/schema/companies.ts + soft delete extension
import { integer, pgTable, timestamp, varchar, text } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const brands = pgTable('brands', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  description: text(),
  logoUrl: varchar('logo_url', { length: 1024 }),
  companyId: integer('company_id').notNull().references(() => companies.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
```

### Drizzle Schema: BrandListing with Status Enum
```typescript
import { integer, pgEnum, pgTable, timestamp, varchar, text } from 'drizzle-orm/pg-core';
import { brands } from './brands';

export const listingStatusEnum = pgEnum('listing_status', [
  'draft', 'active', 'sold_out', 'archived',
]);

export const brandListings = pgTable('brand_listings', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  brandId: integer('brand_id').notNull().references(() => brands.id),
  status: listingStatusEnum().notNull().default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
```

### Drizzle Schema: InventorySKU
```typescript
import { integer, numeric, pgTable, timestamp, varchar, text, date } from 'drizzle-orm/pg-core';
import { brandListings } from './brand-listings';

export const inventorySkus = pgTable('inventory_skus', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  listingId: integer('listing_id').notNull().references(() => brandListings.id),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  upc: varchar({ length: 20 }),
  size: varchar({ length: 100 }),
  casePack: integer('case_pack'),
  price: numeric({ precision: 10, scale: 2 }).notNull(),
  msrp: numeric({ precision: 10, scale: 2 }),
  quantity: integer().notNull().default(0),
  expirationDate: date('expiration_date'),
  imageUrl: varchar('image_url', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
```

### Drizzle Schema: Listing Images (Ordered, up to 5)
```typescript
import { integer, pgTable, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';
import { brandListings } from './brand-listings';

export const brandListingImages = pgTable('brand_listing_images', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  listingId: integer('listing_id').notNull().references(() => brandListings.id),
  imageUrl: varchar('image_url', { length: 1024 }).notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Drizzle Schema: Category + Join Table
```typescript
// categories.ts
import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  icon: varchar({ length: 100 }), // Lucide icon name as string
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// listing-categories.ts (join table)
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { brandListings } from './brand-listings';
import { categories } from './categories';

export const listingCategories = pgTable('listing_categories', {
  listingId: integer('listing_id').notNull().references(() => brandListings.id),
  categoryId: integer('category_id').notNull().references(() => categories.id),
}, (table) => [
  primaryKey({ columns: [table.listingId, table.categoryId] }),
]);
```

### Shared Zod Schema: Brand Validation
```typescript
// Source: Existing pattern from packages/shared/src/schemas/company.ts
import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(255),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().max(1024).optional(),
  companyId: z.number().int().positive('Company is required'),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
```

### Const Object Pattern: ListingStatus
```typescript
// Source: Existing pattern from packages/shared/src/types/user.ts (UserRole)
export const ListingStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  SOLD_OUT: 'sold_out',
  ARCHIVED: 'archived',
} as const;

export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  [ListingStatus.DRAFT]: 'Draft',
  [ListingStatus.ACTIVE]: 'Active',
  [ListingStatus.SOLD_OUT]: 'Sold Out',
  [ListingStatus.ARCHIVED]: 'Archived',
};
```

### Reusable Data Table Component
```typescript
// Source: shadcn/ui Data Table documentation
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchValue?: string;
}

export function DataTable<TData, TValue>({
  columns, data, searchKey, searchValue,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Pagination controls */}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-router-dom package | react-router package (v7 consolidation) | React Router v7 (2024) | Import from "react-router" not "react-router-dom". The -dom package re-exports from react-router. |
| BrowserRouter + Routes JSX | createBrowserRouter + RouterProvider | React Router v6.4+ | Data mode enables loaders/actions. createBrowserRouter is the recommended API for new projects. |
| useEffect + useState for API | TanStack Query v5 | 2024 | Eliminates manual loading/error state management. Provides cache, dedup, background refetch. |
| Manual file upload (multer) | Presigned URL direct upload | Standard practice | API generates URL, browser uploads directly to cloud storage. No file bytes through the server. |
| Hard delete (DELETE FROM) | Soft delete (deletedAt timestamp) | Industry standard for referential data | Preserves data for future order/offer references. Can be "undeleted" if needed. |

**Deprecated/outdated:**
- `react-router-dom` as a separate install: In v7, use `react-router` directly. `react-router-dom` still works but just re-exports.
- `@hookform/resolvers` with Zod 4.x: Known TypeScript issues. This project uses Zod 3.x so this is not a concern.
- AWS SDK v2 (`aws-sdk`): Deprecated. Use `@aws-sdk/client-s3` v3 modular packages.

## Open Questions

1. **R2 public URL configuration**
   - What we know: R2 buckets can be made public via a custom domain or Cloudflare's r2.dev subdomain. Presigned URLs use the S3 API endpoint, not the public URL.
   - What's unclear: Whether the project will use r2.dev subdomain (free but rate-limited) or a custom domain for serving images publicly.
   - Recommendation: Use r2.dev for development, plan custom domain for production. Store the public base URL in an environment variable (`R2_PUBLIC_URL`).

2. **Slug generation for brands and categories**
   - What we know: Brands and categories need URL-friendly slugs for future phases (storefront URLs like /brands/luxe-beauty).
   - What's unclear: Whether to auto-generate slugs from names or let admin set them manually.
   - Recommendation: Auto-generate from name on creation (using simple kebab-case conversion), allow admin override on edit. Enforce uniqueness at the DB level.

3. **Sidebar sub-navigation implementation**
   - What we know: User wants "Manage" to expand into sub-items (Brands, Categories, Listings). Current sidebar uses SidebarMenu with flat items.
   - What's unclear: Whether shadcn Sidebar supports collapsible sub-items natively.
   - Recommendation: shadcn/ui Sidebar has `SidebarMenuSub` and `SidebarMenuSubItem` components for exactly this pattern. Use `Collapsible` from shadcn wrapping the sub-items.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x |
| Config file | apps/api/vitest.config.ts |
| Quick run command | `cd apps/api && pnpm test` |
| Full suite command | `pnpm test` (root turborepo) |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMN-01a | Brand CRUD API: create, read, update, soft-delete | unit | `cd apps/api && npx vitest run src/__tests__/routes/brands.test.ts` | No -- Wave 0 |
| ADMN-01b | Category CRUD API: create, read, update, soft-delete | unit | `cd apps/api && npx vitest run src/__tests__/routes/categories.test.ts` | No -- Wave 0 |
| ADMN-01c | Listing CRUD API: create with SKUs, read with joins, update, soft-delete | unit | `cd apps/api && npx vitest run src/__tests__/routes/listings.test.ts` | No -- Wave 0 |
| ADMN-01d | Presigned URL generation returns valid upload URL | unit | `cd apps/api && npx vitest run src/__tests__/routes/uploads.test.ts` | No -- Wave 0 |
| ADMN-01e | Zod schemas validate correct and reject invalid input | unit | `cd apps/api && npx vitest run src/__tests__/schemas/catalog.test.ts` | No -- Wave 0 |
| ADMN-02a | Category seed data includes all CPG categories | unit | `cd apps/api && npx vitest run src/__tests__/seed/categories.test.ts` | No -- Wave 0 |
| ADMN-02b | Soft delete filters out deleted records from list endpoints | unit | `cd apps/api && npx vitest run src/__tests__/routes/brands.test.ts -t "soft delete"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd apps/api && pnpm test`
- **Per wave merge:** `pnpm test` (root turborepo)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/src/__tests__/routes/brands.test.ts` -- covers ADMN-01a, ADMN-02b
- [ ] `apps/api/src/__tests__/routes/categories.test.ts` -- covers ADMN-01b
- [ ] `apps/api/src/__tests__/routes/listings.test.ts` -- covers ADMN-01c
- [ ] `apps/api/src/__tests__/routes/uploads.test.ts` -- covers ADMN-01d
- [ ] `apps/api/src/__tests__/schemas/catalog.test.ts` -- covers ADMN-01e
- [ ] Test setup: DB mocking strategy needed (mock drizzle `db` object or use test database)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/api/src/routes/companies.ts` -- CRUD route pattern template
- Existing codebase: `packages/shared/src/schemas/company.ts` -- Zod schema pattern template
- Existing codebase: `apps/api/src/db/schema/` -- Drizzle table definition pattern
- [Cloudflare R2 AWS SDK v3 docs](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) -- S3Client configuration, PutObjectCommand
- [Cloudflare R2 Presigned URLs docs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) -- expiration, Content-Type requirements, security
- [Cloudflare R2 CORS configuration](https://developers.cloudflare.com/r2/buckets/cors/) -- bucket CORS policy setup
- [shadcn/ui Data Table docs](https://ui.shadcn.com/docs/components/radix/data-table) -- TanStack Table integration
- [shadcn/ui Form docs](https://ui.shadcn.com/docs/forms/react-hook-form) -- react-hook-form + Zod pattern
- [shadcn/ui Dialog docs](https://ui.shadcn.com/docs/components/radix/dialog) -- modal form pattern
- [TanStack Query v5 Mutations](https://tanstack.com/query/v5/docs/react/guides/mutations) -- useMutation API
- [TanStack Query v5 Invalidation](https://tanstack.com/query/v5/docs/react/guides/invalidations-from-mutations) -- cache invalidation on mutation success
- [React Router v7 docs](https://reactrouter.com/) -- createBrowserRouter, RouterProvider, SPA mode

### Secondary (MEDIUM confidence)
- [Drizzle ORM soft delete discussion](https://github.com/drizzle-team/drizzle-orm/discussions/4031) -- community patterns for deletedAt
- [shadcn/ui Dialog + Form discussion](https://github.com/shadcn-ui/ui/discussions/2918) -- dialog submit pattern

### Tertiary (LOW confidence)
- Package versions verified via npm search results (March 2026)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All libraries already used or documented in project STACK.md research. Versions verified via npm.
- Architecture: HIGH -- Follows established patterns from Phase 1 codebase. New patterns (data tables, forms, uploads) based on official library docs.
- Pitfalls: HIGH -- Cloudflare R2 Content-Type/CORS issues are well-documented. Soft delete filter oversight is a known pattern. Router migration risks identified from codebase analysis.
- Data model: HIGH -- Schema hierarchy (Brand -> BrandListing -> InventorySKU) directly from user decisions, with all field requirements specified.

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable domain, 30-day validity)

---
*Phase: 02-admin-catalog-management*
*Research completed: 2026-03-08*
