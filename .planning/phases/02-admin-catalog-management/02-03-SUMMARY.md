---
phase: 02-admin-catalog-management
plan: 03
subsystem: api, ui
tags: [express, drizzle, crud, soft-delete, pagination, r2, presigned-url, tanstack-table, shadcn-ui, alert-dialog, image-upload]

# Dependency graph
requires:
  - phase: 02-admin-catalog-management
    provides: brands/categories tables with soft delete, Drizzle relations, Zod schemas, API_ROUTES constants
provides:
  - Brand CRUD API route with pagination, search, companyId filter, auto-slug
  - Category CRUD API route with pagination, search, displayOrder sort, auto-slug
  - Upload presigned URL API route for Cloudflare R2 direct browser upload
  - DataTable generic reusable component wrapping TanStack Table v8
  - ConfirmDeleteDialog for soft-delete confirmation UX
  - ImageUploader with drag-and-drop, preview, size validation
  - ImagePlaceholder component for missing images
affects: [02-04-listings-crud, 02-05-image-uploads, 02-06-brand-category-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [slug-auto-generation-with-uniqueness, server-side-pagination-with-count, presigned-url-upload-to-r2, generic-data-table-component]

key-files:
  created:
    - apps/api/src/routes/brands.ts
    - apps/api/src/routes/categories.ts
    - apps/api/src/routes/uploads.ts
    - apps/web/src/components/shared/DataTable.tsx
    - apps/web/src/components/shared/ConfirmDeleteDialog.tsx
    - apps/web/src/components/shared/ImageUploader.tsx
    - apps/web/src/components/shared/ImagePlaceholder.tsx
  modified:
    - apps/api/src/index.ts
    - apps/api/.env.example

key-decisions:
  - "Slug uniqueness uses ne() (not equal) filter to exclude current entity on update, avoiding complex self-join logic"
  - "Brand list GET joins with companies table to include companyName in response (avoiding N+1)"
  - "ImageUploader delegates actual upload to parent component -- only handles file selection, validation, and preview"

patterns-established:
  - "CRUD route pattern: generateSlug + findUniqueSlug helpers reused across brand/category routes"
  - "Paginated list response: { data, pagination: { page, limit, total, pageCount } }"
  - "DataTable: generic TanStack Table wrapper with controlled sorting/pagination state"
  - "ConfirmDeleteDialog: AlertDialog with isPending prop for async delete operations"

requirements-completed: [ADMN-02]

# Metrics
duration: 4min
completed: 2026-03-09
---

# Phase 2 Plan 03: Brands/Categories CRUD & Shared UI Components Summary

**Brand and category CRUD API routes with pagination/search/soft-delete, R2 presigned URL uploads, and four reusable shared UI components (DataTable, ConfirmDeleteDialog, ImageUploader, ImagePlaceholder)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T13:40:58Z
- **Completed:** 2026-03-09T13:44:53Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Brand CRUD API with pagination, search (ilike), companyId filter, company name join, auto-slug generation with uniqueness, soft delete
- Category CRUD API with pagination, search, displayOrder ASC sorting, auto-slug, soft delete
- Upload presigned URL endpoint for Cloudflare R2 with sanitized file names and 10-minute expiry
- All 3 routes registered in Express at /api/brands, /api/categories, /api/uploads
- DataTable: generic TanStack Table v8 wrapper with sortable headers, pagination controls, skeleton loading, empty state
- ConfirmDeleteDialog: AlertDialog with destructive confirm button and pending state spinner
- ImageUploader: drag-and-drop upload zone with file size validation, image preview, and remove button
- ImagePlaceholder: minimal gray background with centered image icon

## Task Commits

Each task was committed atomically:

1. **Task 1: Create brand, category, and upload API routes** - `3b3f745` (feat)
2. **Task 2: Create reusable shared UI components** - `e67555c` (feat)

## Files Created/Modified
- `apps/api/src/routes/brands.ts` - Brand CRUD with pagination, search, slug generation, soft delete
- `apps/api/src/routes/categories.ts` - Category CRUD with pagination, search, displayOrder sort, soft delete
- `apps/api/src/routes/uploads.ts` - Presigned URL generation for R2 direct browser upload
- `apps/api/src/index.ts` - Registered brandRouter, categoryRouter, uploadRouter
- `apps/api/.env.example` - Added R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
- `apps/web/src/components/shared/DataTable.tsx` - Generic TanStack Table wrapper with sorting, pagination, loading states
- `apps/web/src/components/shared/ConfirmDeleteDialog.tsx` - Soft-delete confirmation with pending state
- `apps/web/src/components/shared/ImageUploader.tsx` - Drag-and-drop file upload with preview and size validation
- `apps/web/src/components/shared/ImagePlaceholder.tsx` - Gray placeholder with centered image icon

## Decisions Made
- Slug uniqueness uses `ne()` (not equal) filter to exclude current entity on updates, keeping the logic simple and avoiding complex self-joins
- Brand list GET joins with companies table to include companyName in response, preventing N+1 queries on the frontend
- ImageUploader delegates actual upload to parent component (via onChange callback with File object) -- the parent handles presigned URL fetching and upload

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

**Cloudflare R2 requires manual configuration.** The following environment variables must be set in `apps/api/.env`:
- `R2_ACCOUNT_ID` - Cloudflare Account ID (Dashboard -> R2 -> Overview)
- `R2_ACCESS_KEY_ID` - R2 API Token Access Key ID
- `R2_SECRET_ACCESS_KEY` - R2 API Token Secret Access Key
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_PUBLIC_URL` - R2 public access URL (r2.dev subdomain or custom domain)

Dashboard setup: Create R2 bucket, enable public access, configure CORS (allow PUT from localhost:5173).

## Next Phase Readiness
- All 3 API routes ready for frontend consumption (Plans 04-06)
- DataTable component ready for brand, category, and listing list pages
- ConfirmDeleteDialog ready for all soft-delete operations
- ImageUploader and ImagePlaceholder ready for brand logo and listing image upload
- R2 env vars documented; actual configuration is a user task before image upload testing

## Self-Check: PASSED

All 7 created files verified present. Both task commits (3b3f745, e67555c) verified in git log.

---
*Phase: 02-admin-catalog-management*
*Completed: 2026-03-09*
