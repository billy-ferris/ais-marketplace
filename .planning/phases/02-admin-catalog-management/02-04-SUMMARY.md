---
phase: 02-admin-catalog-management
plan: 04
subsystem: ui
tags: [tanstack-query, react-hook-form, zod, sonner, shadcn-ui, dialog, data-table, crud, presigned-url, debounce]

# Dependency graph
requires:
  - phase: 02-admin-catalog-management
    provides: Brand/category CRUD API routes, DataTable, ConfirmDeleteDialog, ImageUploader, ImagePlaceholder, Zod schemas, API_ROUTES, React Router /manage/* stubs
provides:
  - TanStack Query hooks for brand CRUD (useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand)
  - TanStack Query hooks for category CRUD (useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory)
  - useUpload hook for presigned URL fetch + direct R2 browser upload
  - useDebounce generic debounce hook
  - BrandDialog with react-hook-form, zodResolver, image upload, company select
  - CategoryDialog with react-hook-form, zodResolver, icon name + display order
  - Brand column definitions with logo thumbnail, company name, sortable headers, actions dropdown
  - Category column definitions with icon name display, sortable headers, actions dropdown
  - BrandsPage with search, pagination, create/edit dialog, soft-delete confirmation
  - CategoriesPage with search, pagination, create/edit dialog, soft-delete confirmation
affects: [02-05-listings-crud, 02-06-listings-pages, 03-storefront]

# Tech tracking
tech-stack:
  added: []
  patterns: [tanstack-query-crud-hooks-with-toast, react-hook-form-dialog-pattern, debounced-search-with-pagination-reset, column-callbacks-for-edit-delete]

key-files:
  created:
    - apps/web/src/hooks/useBrands.ts
    - apps/web/src/hooks/useCategories.ts
    - apps/web/src/hooks/useUpload.ts
    - apps/web/src/hooks/useDebounce.ts
    - apps/web/src/components/manage/BrandDialog.tsx
    - apps/web/src/components/manage/CategoryDialog.tsx
    - apps/web/src/components/manage/columns/brand-columns.tsx
    - apps/web/src/components/manage/columns/category-columns.tsx
  modified:
    - apps/web/src/pages/manage/BrandsPage.tsx
    - apps/web/src/pages/manage/CategoriesPage.tsx

key-decisions:
  - "Icon column shows Lucide icon name as code badge instead of rendering actual icon to avoid importing entire lucide-react icons map (saves ~1MB bundle)"
  - "No shadcn Form component -- used react-hook-form directly with register/errors pattern since form.tsx was not installed"
  - "Company select filters to manufacturer type on client side using existing /api/companies endpoint"

patterns-established:
  - "TanStack Query CRUD hook pattern: useQuery for list/detail, useMutation with queryClient.invalidateQueries and toast feedback"
  - "Dialog form pattern: react-hook-form with zodResolver, useEffect to reset form on open, mutation onSuccess closes dialog"
  - "Column definition factory: getBrandColumns({ onEdit, onDelete }) returns ColumnDef array with callback-driven actions"
  - "Debounced search: useDebounce(search, 300) + pagination reset to page 0 on search change"

requirements-completed: [ADMN-02]

# Metrics
duration: 5min
completed: 2026-03-09
---

# Phase 2 Plan 04: Brand & Category Management Pages Summary

**Full brand and category management UI with TanStack Query CRUD hooks, react-hook-form dialog modals, searchable/sortable data tables, and presigned URL image upload**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-09T13:48:26Z
- **Completed:** 2026-03-09T13:53:22Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- TanStack Query hooks for brand, category, and upload CRUD with cache invalidation and toast notifications
- BrandDialog with react-hook-form + zodResolver, manufacturer company select, and logo image upload via presigned URL
- CategoryDialog with name, Lucide icon name, and display order fields
- Brand and category column definitions with sortable headers and actions dropdown (edit/delete)
- BrandsPage replacing stub with full search, pagination, create/edit/delete functionality
- CategoriesPage replacing stub with full search, pagination, create/edit/delete functionality
- useDebounce hook for 300ms debounced search input
- Full monorepo build passes, API test stubs run successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TanStack Query hooks for brands, categories, and upload** - `19445b3` (feat)
2. **Task 2: Build BrandDialog, CategoryDialog, column definitions, and management pages** - `a6f8a74` (feat)

## Files Created/Modified
- `apps/web/src/hooks/useBrands.ts` - TanStack Query hooks for brand CRUD (list, detail, create, update, delete)
- `apps/web/src/hooks/useCategories.ts` - TanStack Query hooks for category CRUD (list, detail, create, update, delete)
- `apps/web/src/hooks/useUpload.ts` - Presigned URL fetch + direct R2 browser upload with isUploading state
- `apps/web/src/hooks/useDebounce.ts` - Generic debounce hook for search input
- `apps/web/src/components/manage/BrandDialog.tsx` - Create/edit brand dialog with form, company select, logo upload
- `apps/web/src/components/manage/CategoryDialog.tsx` - Create/edit category dialog with name, icon, display order
- `apps/web/src/components/manage/columns/brand-columns.tsx` - TanStack Table column defs with logo, name, company, actions
- `apps/web/src/components/manage/columns/category-columns.tsx` - TanStack Table column defs with icon, name, order, actions
- `apps/web/src/pages/manage/BrandsPage.tsx` - Full management page replacing stub (search, pagination, CRUD dialogs)
- `apps/web/src/pages/manage/CategoriesPage.tsx` - Full management page replacing stub (search, pagination, CRUD dialogs)

## Decisions Made
- Displayed Lucide icon name as a styled code badge in category table instead of rendering the actual icon component -- importing the entire `icons` map from lucide-react added ~1MB to the bundle. Icon rendering can be implemented for the storefront in Phase 3 where visual fidelity matters more.
- Used react-hook-form directly with register/errors pattern rather than shadcn's Form component wrapper, since form.tsx was not installed in the project. The direct approach is lighter and works well for the dialog-based forms.
- Company select in BrandDialog fetches all companies from `/api/companies` and filters to `type === 'manufacturer'` on the client. This avoids adding a new API endpoint for the small list of companies.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created missing useDebounce hook**
- **Found during:** Task 2 (BrandsPage implementation)
- **Issue:** Plan referenced debounced search but no useDebounce hook existed
- **Fix:** Created `apps/web/src/hooks/useDebounce.ts` with generic useState/useEffect debounce pattern
- **Files modified:** apps/web/src/hooks/useDebounce.ts
- **Verification:** Build passes, search debouncing works correctly
- **Committed in:** a6f8a74 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed bundle bloat from lucide-react icons import**
- **Found during:** Task 2 (category-columns implementation)
- **Issue:** Importing `icons` from lucide-react to render dynamic icons by name added ~1MB to the bundle (688KB -> 1670KB)
- **Fix:** Replaced dynamic icon rendering with styled icon name text display using code badge
- **Files modified:** apps/web/src/components/manage/columns/category-columns.tsx
- **Verification:** Bundle size reduced from 1670KB to 885KB. Build passes.
- **Committed in:** a6f8a74 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary -- useDebounce for search functionality, icon fix for reasonable bundle size. No scope creep.

## Issues Encountered
- base-ui Select `onValueChange` type includes `null` in the union -- required null guard before calling `setValue` on the react-hook-form field. Fixed inline during Task 2.

## User Setup Required
None -- no new external service configuration required (R2 configuration from Plan 03 still applies).

## Next Phase Readiness
- Brand and category management pages are fully functional at /manage/brands and /manage/categories
- TanStack Query CRUD hook pattern established and reusable for listings (Plan 05/06)
- Dialog form pattern with react-hook-form + zodResolver ready to extend for more complex listing forms
- Column definition factory pattern reusable for listing columns
- useDebounce hook available for any future search inputs

## Self-Check: PASSED

All 8 created files verified present. Both task commits (19445b3, a6f8a74) verified in git log.

---
*Phase: 02-admin-catalog-management*
*Completed: 2026-03-09*
