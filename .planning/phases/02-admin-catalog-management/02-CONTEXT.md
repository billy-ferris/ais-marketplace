# Phase 2: Admin Catalog Management - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can create, edit, and manage inventory listings, brands, and categories in PostgreSQL through a custom admin interface. This phase builds the data model and admin CRUD tooling — no storefront, no retailer-facing views, no order/offer logic.

</domain>

<decisions>
## Implementation Decisions

### Admin UI approach
- Custom shadcn/ui pages — no React-Admin or other admin framework
- Separate pages for each entity: /manage/brands, /manage/categories, /manage/listings
- Sidebar "Manage" item expands into sub-nav items (Brands, Categories, Listings)
- Brands and categories use dialog modals for create/edit (few fields)
- Listings use dedicated create/edit pages (many fields — images, SKUs, pricing)

### Image handling
- Cloudflare R2 for image storage, URLs stored in PostgreSQL
- Direct browser upload via presigned URLs (API generates URL, browser uploads to R2)
- BrandListings: multiple images (up to 5) with a designated primary/hero image, admin can reorder
- InventorySKUs: single product image per SKU
- Brands: single logo image upload
- Categories: no image — use Lucide icons
- All images optional with placeholder fallback for demo velocity

### Product data model
- Hierarchy: Brand → BrandListing → InventorySKU
- Brand belongs to a company (manufacturer) via companyId — listings inherit manufacturer through brand
- BrandListing is a "lot" or "batch" wrapper: title/name, description, brandId, status, images
- InventorySKU holds product-level details: UPC, name, description, size, case pack, price, MSRP, quantity, expiration date, single image
- Many-to-many relationship between listings and categories via join table (listing_categories)
- BrandListing status enum: draft, active, sold_out, archived
- CPG categories (Beauty Tools, Fragrances, Hair Care, Health & Wellness, Makeup, Nail Care, Skincare) pre-seeded but admin can edit/add more
- Negotiation potential, restrictions, and FOB location fields deferred to v2

### Management UX
- Data tables for all list views (sortable, searchable, with inline action buttons per row)
- Soft delete with confirmation dialog (deletedAt timestamp, not hard delete)
- SKUs added inline on the listing create/edit page (not a separate page)
- Search bar + filter dropdowns on each management table (e.g., filter listings by status, search brands by name)
- Server-side filtering via API query params

### Claude's Discretion
- Exact table column selection and sort defaults
- Form field layout and validation UX
- Presigned URL expiration and R2 bucket configuration
- Pagination approach for tables (offset vs cursor)
- Loading states and error handling patterns
- shadcn/ui component selection (which specific components to install)

</decisions>

<specifics>
## Specific Ideas

- Individual SKUs should each allow a single product image (user-specified requirement)
- Many-to-many categories chosen because CPG products can span verticals (e.g., a product could be both "Skincare" and "Health & Wellness")
- Soft delete chosen to preserve data integrity for future order/offer references

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/src/routes/companies.ts`: Template CRUD route pattern with requireAuth/requireRole middleware
- `packages/shared/src/schemas/company.ts`: Template Zod schema pattern (create + partial update)
- `apps/web/src/lib/api.ts`: apiFetch() utility for API calls with credentials
- `apps/web/src/components/shared/RoleGuard.tsx`: Role-based access wrapper
- `apps/web/src/components/shared/ComingSoonCard.tsx`: Placeholder cards (to be replaced with real admin UI)
- shadcn/ui components already installed: button, card, badge, separator, avatar, input, skeleton, tooltip, sheet, sidebar

### Established Patterns
- Drizzle ORM with pgEnum for enums, timestamps with defaultNow()
- Relations defined separately in relations.ts using one()/many()
- Express routes: GET list, GET by ID, POST create, PATCH update — protected by requireAuth() + requireRole('admin')
- Zod validation in shared package, parsed in route handlers, ZodError caught by error middleware
- Const object pattern for enums (not TS enums)
- API routes registered in API_ROUTES constant in shared package

### Integration Points
- Sidebar nav: ADMIN_NAV_ITEMS in apps/web/src/lib/constants.ts — currently has Dashboard, Manage, Users
- Admin dashboard: apps/web/src/pages/AdminDashboard.tsx — shows Coming Soon cards to replace
- Route registration: apps/api/src/index.ts — app.use() pattern for new route modules
- Schema exports: apps/api/src/db/schema/index.ts — barrel file for all tables
- Seed script: apps/api/src/db/seed.ts — extend to seed brands, categories, and sample listings

</code_context>

<deferred>
## Deferred Ideas

- Negotiation potential indicator (Low/Med/High) on listings — v2 (CATL-06)
- Geographic restrictions and retail restrictions on listings — v2 (CATL-07)
- FOB/Ship From location on listings — v2 (CATL-07)
- Hero/featured listing curation — Phase 3 (CATL-05)
- Manufacturer self-serve inventory upload — v2 (MFPR-04)

</deferred>

---

*Phase: 02-admin-catalog-management*
*Context gathered: 2026-03-08*
