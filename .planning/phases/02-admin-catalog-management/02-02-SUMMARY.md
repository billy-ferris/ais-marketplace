---
phase: 02-admin-catalog-management
plan: 02
subsystem: ui, api
tags: [zod, react-router, tanstack-query, tanstack-table, react-hook-form, sonner, shadcn-ui, aws-sdk-s3, sidebar]

# Dependency graph
requires:
  - phase: 01-foundation-and-auth
    provides: Shared package patterns (UserRole const object, Zod schemas), AppShell/Sidebar, Clerk auth, DashboardLayout
provides:
  - Shared Zod schemas for brand, category, listing, SKU validation
  - ListingStatus const object and LISTING_STATUS_LABELS
  - CPG_CATEGORIES seed list (7 default categories)
  - API_ROUTES extended with brands, categories, listings, uploads
  - Brand, BrandListing, InventorySKU, Category TypeScript interfaces
  - React Router with /manage/* routes and stub pages
  - QueryClientProvider wrapping authenticated app
  - Sonner Toaster for toast notifications
  - Collapsible sidebar sub-navigation for Manage section
  - shadcn/ui components: table, dialog, select, textarea, dropdown-menu, label, tabs, form, alert-dialog, switch, sonner, collapsible
affects: [02-03-brands-categories-crud, 02-04-listings-crud, 02-05-image-uploads]

# Tech tracking
tech-stack:
  added: [react-router@7.x, @tanstack/react-query@5.x, @tanstack/react-table@8.x, react-hook-form@7.x, @hookform/resolvers@5.x, sonner@2.x, @aws-sdk/client-s3@3.x, @aws-sdk/s3-request-presigner@3.x, @tanstack/react-query-devtools@5.x]
  patterns: [collapsible-sidebar-sub-nav, react-router-outlet-layout, query-client-provider-wrap, render-prop-link-navigation]

key-files:
  created:
    - packages/shared/src/types/catalog.ts
    - packages/shared/src/schemas/brand.ts
    - packages/shared/src/schemas/category.ts
    - packages/shared/src/schemas/listing.ts
    - packages/shared/src/schemas/inventory-sku.ts
    - packages/shared/src/constants/catalog.ts
    - apps/web/src/lib/router.tsx
    - apps/web/src/pages/manage/BrandsPage.tsx
    - apps/web/src/pages/manage/CategoriesPage.tsx
    - apps/web/src/pages/manage/ListingsPage.tsx
    - apps/web/src/pages/manage/ListingCreatePage.tsx
    - apps/web/src/pages/manage/ListingEditPage.tsx
  modified:
    - packages/shared/src/types/index.ts
    - packages/shared/src/schemas/index.ts
    - packages/shared/src/constants/routes.ts
    - packages/shared/src/constants/index.ts
    - packages/shared/src/index.ts
    - apps/web/src/App.tsx
    - apps/web/src/components/layout/AppShell.tsx
    - apps/web/src/components/layout/AppSidebar.tsx
    - apps/web/src/lib/constants.ts
    - apps/web/package.json
    - apps/api/package.json

key-decisions:
  - "shadcn/ui SidebarMenuSubButton render prop with React Router Link for navigation (not wrapping Link around SidebarMenuButton)"
  - "expirationDate schema accepts both ISO datetime and date-only strings for flexibility"
  - "Collapsible defaultOpen driven by current pathname (auto-expands when on /manage/* route)"

patterns-established:
  - "Render prop navigation: SidebarMenuButton render={<Link to={path} />} for React Router integration with shadcn sidebar"
  - "Collapsible sub-nav: Collapsible + CollapsibleTrigger wrapping SidebarMenuButton + SidebarMenuSub for expandable nav groups"
  - "Router-outlet layout: AppShell uses Outlet for child route rendering, DashboardLayout rendered via index route"
  - "QueryClient at app level: Single QueryClient instance at module scope in App.tsx, wrapping RouterProvider"

requirements-completed: [ADMN-01, ADMN-02]

# Metrics
duration: 7min
completed: 2026-03-09
---

# Phase 2 Plan 02: Shared Types, Routing, and Sidebar Summary

**Zod schemas for all catalog entities, React Router with /manage/* routes, TanStack Query provider, and collapsible sidebar sub-navigation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-09T13:30:15Z
- **Completed:** 2026-03-09T13:36:56Z
- **Tasks:** 2
- **Files modified:** 35

## Accomplishments
- Shared Zod schemas for brand, category, listing, and SKU create/update validation with type exports
- ListingStatus const object following established UserRole pattern, CPG_CATEGORIES seed list, API_ROUTES extended
- React Router with createBrowserRouter serving DashboardLayout at / and stub pages at /manage/*
- Collapsible sidebar Manage section with Brands, Categories, Listings sub-items using React Router Link navigation
- QueryClientProvider + Sonner Toaster wrapping the authenticated app
- All Phase 2 dependencies installed (react-router, TanStack Query/Table, react-hook-form, sonner, AWS SDK S3)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared types, Zod schemas, and constants** - `35ba899` (feat)
2. **Task 2: Install dependencies, set up routing, restructure sidebar** - `6efd1cb` (feat)

## Files Created/Modified
- `packages/shared/src/types/catalog.ts` - ListingStatus const object, Brand/BrandListing/InventorySKU/Category interfaces
- `packages/shared/src/schemas/brand.ts` - createBrandSchema + updateBrandSchema with Zod validation
- `packages/shared/src/schemas/category.ts` - createCategorySchema + updateCategorySchema
- `packages/shared/src/schemas/listing.ts` - createListingSchema + updateListingSchema with status enum
- `packages/shared/src/schemas/inventory-sku.ts` - createSkuSchema + updateSkuSchema with decimal price validation
- `packages/shared/src/constants/catalog.ts` - CPG_CATEGORIES array with 7 default categories
- `packages/shared/src/constants/routes.ts` - API_ROUTES extended with BRANDS, CATEGORIES, LISTINGS, UPLOADS
- `apps/web/src/lib/router.tsx` - React Router configuration with AppShell layout and manage routes
- `apps/web/src/App.tsx` - Replaced direct AppShell with RouterProvider + QueryClientProvider + Toaster
- `apps/web/src/components/layout/AppShell.tsx` - Replaced hardcoded DashboardLayout with Outlet
- `apps/web/src/components/layout/AppSidebar.tsx` - Collapsible Manage sub-nav with React Router Links
- `apps/web/src/lib/constants.ts` - NavItem interface extended with children, Manage has sub-items
- `apps/web/src/pages/manage/*.tsx` - 5 stub pages for manage routes

## Decisions Made
- Used shadcn/ui SidebarMenuSubButton `render` prop with React Router Link instead of wrapping Link around SidebarMenuButton -- follows base-ui render delegation pattern
- expirationDate in SKU schema accepts both ISO datetime and date-only string formats for flexibility
- Collapsible sub-nav defaultOpen is driven by current pathname matching, auto-expanding when user is on /manage/* routes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shared package contracts ready: all Zod schemas, types, and constants available for Plans 03-05
- React Router infrastructure ready: stub pages at /manage/brands, /manage/categories, /manage/listings to be replaced with real implementations
- TanStack Query provider active: CRUD hooks can be created immediately
- Sidebar navigation complete: collapsible Manage section with working link navigation
- All Phase 2 runtime dependencies installed in both API and web apps

## Self-Check: PASSED

All 12 created files verified present. Both task commits (35ba899, 6efd1cb) verified in git log.

---
*Phase: 02-admin-catalog-management*
*Completed: 2026-03-09*
