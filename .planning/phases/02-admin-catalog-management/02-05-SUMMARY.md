---
phase: 02-admin-catalog-management
plan: 05
subsystem: api, ui
tags: [drizzle, express, tanstack-query, react-hook-form, zod, shadcn-ui, data-table, crud, soft-delete, pagination, inline-editor, image-upload, checkbox]

# Dependency graph
requires:
  - phase: 02-admin-catalog-management
    provides: Brand/category CRUD API routes, DataTable, ConfirmDeleteDialog, ImageUploader, TanStack Query hooks pattern, Zod schemas, API_ROUTES, React Router /manage/* routes, useBrands/useCategories hooks
provides:
  - Listing CRUD API route with nested SKU create/update/delete, image management (max 5), category replace
  - Paginated listing list with search, status filter, brand filter, SKU count, and categories
  - Full listing detail with relational query (brand, company, SKUs, images, categories)
  - Soft-delete listing with cascade to SKUs and cleanup of join tables
  - TanStack Query hooks for listing CRUD (useListings, useListing, useCreateListing, useUpdateListing, useDeleteListing)
  - ListingsPage with searchable/filterable data table, status badges, category badges
  - ListingCreatePage with full form and inline SKU editor
  - ListingEditPage with pre-populated form and loading/not-found states
  - ListingForm shared component with 4 sections (basic info, categories, images, SKUs)
  - SkuInlineEditor with add/remove/edit/undo for managing SKU rows inline
  - listing-columns with status badge color coding, brand name, SKU count, category badges
affects: [02-06-seed-data, 02-07-admin-polish, 03-storefront]

# Tech tracking
tech-stack:
  added: []
  patterns: [nested-relational-api-crud, inline-sku-editor-with-create-update-delete-arrays, multi-image-form-with-reorder-and-primary, category-checkbox-multi-select, zod-input-vs-output-types-for-forms]

key-files:
  created:
    - apps/api/src/routes/listings.ts
    - apps/web/src/hooks/useListings.ts
    - apps/web/src/components/manage/ListingForm.tsx
    - apps/web/src/components/manage/SkuInlineEditor.tsx
    - apps/web/src/components/manage/columns/listing-columns.tsx
    - apps/web/src/components/ui/checkbox.tsx
  modified:
    - apps/api/src/index.ts
    - apps/web/src/pages/manage/ListingsPage.tsx
    - apps/web/src/pages/manage/ListingCreatePage.tsx
    - apps/web/src/pages/manage/ListingEditPage.tsx

key-decisions:
  - "Used z.input<> type for useForm and z.output<> for submission handler -- zodResolver applies schema defaults (e.g. status default) between input and output, so form must use the pre-default input type"
  - "Checkbox multi-select for categories rather than complex multi-select dropdown -- simpler, sufficient for small category lists, shadcn Checkbox component installed"
  - "SkuInlineEditor uses _deleted flag for existing SKUs instead of immediate removal -- allows undo and produces clean create/update/delete arrays for the API"
  - "ListingForm images support reorder (up/down buttons), set-primary, and remove with hover-reveal controls"

patterns-established:
  - "Nested CRUD API: listing route accepts structured payload with listing, skus (create/update/delete), images (create/delete), categoryIds (replace)"
  - "Inline editor pattern: SkuInlineEditor + buildSkuPayload transforms flat form state into API-ready create/update/delete arrays"
  - "Multi-image form: ImageFormData[] with displayOrder, isPrimary, add/remove/reorder capabilities"
  - "Category multi-select: Checkbox grid with selectedCategoryIds state, passed as flat array to API"
  - "Zod form type pattern: z.input<schema> for useForm, zodResolver applies defaults at validation time"

requirements-completed: [ADMN-01]

# Metrics
duration: 12min
completed: 2026-03-09
---

# Phase 2 Plan 05: Listing CRUD & Management Pages Summary

**Full listing CRUD API with nested SKU/image/category management, data table with status filters, and create/edit pages with inline SKU editor, multi-image upload, and category checkboxes**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-09T13:58:17Z
- **Completed:** 2026-03-09T14:10:23Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Listing CRUD API at /api/listings with GET (paginated list with joins), GET/:id (full relational query), POST (nested creation), PATCH (granular updates), DELETE (cascade soft-delete)
- ListingsPage replacing stub with searchable, status-filterable data table showing brand name, status badges, SKU count, and category badges
- ListingCreatePage with full ListingForm: basic info (name, description, brand select, status select), category checkboxes, up to 5 images with reorder/primary, and inline SKU editor
- ListingEditPage that loads existing listing, pre-populates all form sections, and supports granular updates
- SkuInlineEditor component with add/remove/edit/undo capabilities and buildSkuPayload utility for converting form state to API format
- Full monorepo build passes, API test stubs run successfully (22 todo tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create listing API routes with nested SKU and image management** - `a6a1244` (feat)
2. **Task 2: Build ListingsPage, ListingCreatePage, and ListingEditPage with inline SKU editor** - `4907989` (feat)

## Files Created/Modified
- `apps/api/src/routes/listings.ts` - Listing CRUD with nested SKU/image/category management, pagination, search, status filter
- `apps/api/src/index.ts` - Registered listingRouter at API_ROUTES.LISTINGS
- `apps/web/src/hooks/useListings.ts` - TanStack Query hooks for listing CRUD (list, detail, create, update, delete)
- `apps/web/src/components/manage/ListingForm.tsx` - Shared form with 4 sections (basic info, categories, images, SKUs)
- `apps/web/src/components/manage/SkuInlineEditor.tsx` - Inline SKU add/edit/remove with buildSkuPayload utility
- `apps/web/src/components/manage/columns/listing-columns.tsx` - Column defs with status badges, brand, SKU count, category badges, actions
- `apps/web/src/components/ui/checkbox.tsx` - shadcn Checkbox component (installed for category multi-select)
- `apps/web/src/pages/manage/ListingsPage.tsx` - Full management page with search, status filter, data table, delete confirmation
- `apps/web/src/pages/manage/ListingCreatePage.tsx` - Create page with ListingForm and back navigation
- `apps/web/src/pages/manage/ListingEditPage.tsx` - Edit page with loading skeleton, not-found state, pre-populated ListingForm

## Decisions Made
- Used `z.input<typeof createListingSchema>` for useForm type because zodResolver applies schema defaults (like `status: 'draft'`) during validation, which means the form input type has `status?: ...` but the parsed output has `status: ...`. Using the input type for the form and letting zodResolver handle the default avoids TS2322 resolver type mismatch.
- Installed shadcn Checkbox component for category multi-select. A checkbox grid is simpler and more accessible than a complex multi-select dropdown for the current category count (~7 CPG categories).
- SkuInlineEditor uses a `_deleted` flag on existing SKUs instead of immediately splicing them from the array. This enables an "Undo" button for accidental deletions and cleanly separates create/update/delete operations in the payload sent to the API.
- ListingForm images section supports reorder (up/down buttons), set-primary (star button), and remove (X button) with hover-reveal controls for a clean UI.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing shadcn Checkbox component**
- **Found during:** Task 2 (ListingForm category section)
- **Issue:** Plan specifies checkbox multi-select for categories but shadcn Checkbox component was not installed
- **Fix:** Ran `npx shadcn@latest add checkbox` to install the component
- **Files modified:** apps/web/src/components/ui/checkbox.tsx (created)
- **Verification:** Build passes, checkbox renders correctly in category grid
- **Committed in:** 4907989 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed TypeScript type mismatch between zod schema input/output types and react-hook-form**
- **Found during:** Task 2 (ListingForm implementation)
- **Issue:** `createListingSchema` has `.optional().default('draft')` on status field, causing z.infer (output type) to have required status while zodResolver expects the input type with optional status
- **Fix:** Used `z.input<typeof createListingSchema>` for useForm type, `z.output<>` only at submission boundary
- **Files modified:** apps/web/src/components/manage/ListingForm.tsx
- **Verification:** Full monorepo build passes with no type errors
- **Committed in:** 4907989 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary for the build to pass. No scope creep.

## Issues Encountered
- API build initially failed due to implicit `any` type on `parsedSkus.map()` callback in the PATCH route -- TypeScript couldn't infer the return type of `createSkuSchema.parse()` through `.map()`. Fixed by adding explicit `CreateSkuInput[]` type annotation to the parsedSkus variable.

## User Setup Required
None -- no new external service configuration required.

## Next Phase Readiness
- Listing CRUD is fully functional at /manage/listings with create, edit, and delete operations
- Inline SKU editor pattern established for complex nested entity management
- ListingForm can be reused or extended for any future listing-related forms
- useListings hooks available for storefront consumption (Phase 3)
- All listing API endpoints documented by test stubs (22 todo tests covering all CRUD scenarios)
- Category multi-select and multi-image upload patterns ready for reuse

## Self-Check: PASSED

All 6 created files verified present. Both task commits (a6a1244, 4907989) verified in git log.

---
*Phase: 02-admin-catalog-management*
*Completed: 2026-03-09*
