---
phase: 01-foundation-and-auth
plan: 03
subsystem: ui
tags: [clerk, react, shadcn-ui, tailwindcss, sidebar, rbac, vite]

# Dependency graph
requires:
  - phase: 01-foundation-and-auth/01
    provides: Monorepo structure, @ais/shared types (UserRole, ROLE_LABELS, ALL_ROLES, API_ROUTES)
provides:
  - Clerk-authenticated login page (no signup, invite-only)
  - App shell with collapsible shadcn/ui sidebar
  - Role-specific navigation (Admin, Manufacturer, Retailer)
  - Three role-specific dashboard shells with Coming Soon cards
  - useRole hook for Clerk publicMetadata RBAC
  - RoleGuard component for conditional rendering by role
  - apiFetch utility for authenticated API calls
  - 404 and 403 utility pages
affects: [01-04, 02-01, 02-02, 03-02, 04-01, 06-01, 06-02]

# Tech tracking
tech-stack:
  added: [shadcn/ui, class-variance-authority, clsx, tailwind-merge, lucide-react, "@radix-ui/react-slot", "@radix-ui/react-separator", "@radix-ui/react-tooltip", "@radix-ui/react-avatar"]
  patterns: [clerk-core3-show-component, shadcn-sidebar-layout, role-based-nav-routing, coming-soon-card-pattern]

key-files:
  created:
    - apps/web/src/pages/LoginPage.tsx
    - apps/web/src/components/layout/AppShell.tsx
    - apps/web/src/components/layout/AppSidebar.tsx
    - apps/web/src/components/layout/DashboardLayout.tsx
    - apps/web/src/components/shared/ComingSoonCard.tsx
    - apps/web/src/components/shared/RoleGuard.tsx
    - apps/web/src/pages/AdminDashboard.tsx
    - apps/web/src/pages/ManufacturerDashboard.tsx
    - apps/web/src/pages/RetailerDashboard.tsx
    - apps/web/src/pages/NotFoundPage.tsx
    - apps/web/src/pages/ForbiddenPage.tsx
    - apps/web/src/hooks/useRole.ts
    - apps/web/src/lib/api.ts
    - apps/web/src/lib/constants.ts
    - apps/web/.env.example
    - apps/web/components.json
    - apps/web/src/lib/utils.ts
    - apps/web/src/hooks/useIsMobile.ts
  modified:
    - apps/web/src/main.tsx
    - apps/web/src/App.tsx
    - apps/web/src/index.css
    - apps/web/package.json

key-decisions:
  - "Clerk widget handles AIS branding — removed duplicate AIS logo/tagline from LoginPage per user feedback"
  - "Role assignment deferred to seed script in Plan 01-04 — no role returns null from useRole, dashboard shows loading state"
  - "shadcn/ui sidebar with SidebarProvider pattern used for collapsible navigation (not custom sidebar)"

patterns-established:
  - "Clerk Core 3 Show component: use <Show when='signed-in'> and <Show when='signed-out'> for auth gating (not Core 2 SignedIn/SignedOut)"
  - "Role-based navigation: getNavItemsForRole() returns nav config array per UserRole, consumed by AppSidebar"
  - "Coming Soon card pattern: ComingSoonCard component for placeholder features across dashboards"
  - "DashboardLayout role routing: useRole() hook determines which dashboard component renders"
  - "Auth utility pattern: apiFetch() wraps fetch with base URL, JSON headers, and credentials"

requirements-completed: [AUTH-03, AUTH-05]

# Metrics
duration: 17min
completed: 2026-03-08
---

# Phase 1 Plan 03: Frontend Auth Experience Summary

**Clerk-authenticated login page with shadcn/ui collapsible sidebar, role-specific navigation, and three dashboard shells with Coming Soon feature cards**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-09T00:01:03Z
- **Completed:** 2026-03-09T00:17:48Z
- **Tasks:** 4 (3 auto + 1 checkpoint)
- **Files modified:** 41

## Accomplishments
- Login page renders Clerk SignIn component with no signup option (invite-only), centered layout
- App shell with collapsible shadcn/ui sidebar showing AIS branding, role-specific nav items, and user info in footer
- Three role-specific dashboards (Admin, Manufacturer, Retailer) with Coming Soon cards previewing upcoming features
- useRole hook extracts role from Clerk publicMetadata for RBAC throughout the frontend
- RoleGuard component for conditional rendering based on user role with ForbiddenPage fallback
- apiFetch utility and role-based nav constants ready for API integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Install shadcn/ui, set up Clerk React provider, and create utility modules** - `3fb9b60` (feat)
2. **Task 2: Build login page, app shell layout, and sidebar** - `8672be5` (feat)
3. **Task 3: Build role-specific dashboards with Coming Soon cards and utility pages** - `d90a763` (feat)
4. **Task 4: Verify frontend auth experience** - checkpoint (human-verify, approved)

**Post-checkpoint fix:** `07df0b0` (fix) - Removed AIS branding from login page per user feedback

## Files Created/Modified
- `apps/web/src/pages/LoginPage.tsx` - Branded login page with Clerk SignIn component (no signup)
- `apps/web/src/components/layout/AppShell.tsx` - Main authenticated layout with SidebarProvider, SidebarTrigger, and UserButton
- `apps/web/src/components/layout/AppSidebar.tsx` - Collapsible sidebar with role-specific nav items and user info footer
- `apps/web/src/components/layout/DashboardLayout.tsx` - Routes to role-specific dashboard based on useRole
- `apps/web/src/components/shared/ComingSoonCard.tsx` - Reusable card component for upcoming feature placeholders
- `apps/web/src/components/shared/RoleGuard.tsx` - Conditional rendering component checking user role against allowed roles
- `apps/web/src/pages/AdminDashboard.tsx` - Admin dashboard with 5 Coming Soon cards (Inventory, Brands, Users, Offers, Margins)
- `apps/web/src/pages/ManufacturerDashboard.tsx` - Manufacturer dashboard with 3 Coming Soon cards (Inventory, Offers, Orders)
- `apps/web/src/pages/RetailerDashboard.tsx` - Retailer dashboard with 3 Coming Soon cards (Shop, Orders, Offers)
- `apps/web/src/pages/NotFoundPage.tsx` - 404 page with return home link
- `apps/web/src/pages/ForbiddenPage.tsx` - 403 access denied page
- `apps/web/src/hooks/useRole.ts` - Hook extracting role from Clerk publicMetadata with boolean helpers
- `apps/web/src/lib/api.ts` - apiFetch helper with base URL, JSON headers, credentials
- `apps/web/src/lib/constants.ts` - Role-based navigation item definitions with icons
- `apps/web/.env.example` - Environment variable template for Clerk key and API URL
- `apps/web/components.json` - shadcn/ui configuration for Vite project
- `apps/web/src/lib/utils.ts` - cn() utility for Tailwind class merging (shadcn/ui)
- `apps/web/src/hooks/useIsMobile.ts` - Mobile breakpoint detection hook (shadcn/ui)
- `apps/web/src/main.tsx` - ClerkProvider wrapper with publishable key
- `apps/web/src/App.tsx` - Auth-gated routing with Clerk Show component
- `apps/web/src/index.css` - Updated with shadcn/ui theme variables
- `apps/web/package.json` - Added shadcn/ui, Radix, and utility dependencies
- `apps/web/src/components/ui/*.tsx` - shadcn/ui components (sidebar, button, card, badge, separator, avatar, tooltip, skeleton, input, sheet)

## Decisions Made
- **Clerk widget handles branding:** Removed duplicate AIS logo and tagline from LoginPage after user verification showed the Clerk SignIn widget already includes branding. Cleaner visual result.
- **Role assignment deferred:** No role is assigned to users until the seed script runs in Plan 01-04. The useRole hook returns null and DashboardLayout shows a loading state, which is expected behavior.
- **shadcn/ui sidebar over custom:** Used shadcn/ui's SidebarProvider pattern for collapsible sidebar navigation, which provides mobile overlay behavior and keyboard accessibility out of the box.

## Deviations from Plan

### User-Requested Changes

**1. Removed AIS branding from LoginPage**
- **Found during:** Task 4 (checkpoint verification)
- **Issue:** Login page had AIS logo/tagline above Clerk SignIn, but the Clerk widget already includes branding, creating visual redundancy
- **Fix:** Removed AIS text branding from LoginPage, kept clean centered layout with Clerk SignIn and "Contact us for access" message
- **Files modified:** apps/web/src/pages/LoginPage.tsx
- **Committed in:** 07df0b0

---

**Total deviations:** 1 user-requested change
**Impact on plan:** Minor visual adjustment. No scope or architectural change.

## Issues Encountered
- No role assigned after sign-in is expected behavior -- the seed script in Plan 01-04 will assign roles via Clerk publicMetadata. DashboardLayout handles the null-role case with a loading state.

## User Setup Required
None - Clerk publishable key was already configured in .env from prior setup.

## Next Phase Readiness
- Frontend auth shell complete -- ready for Plan 01-04 (Clerk backend auth, RBAC middleware, seed script)
- Once seed script assigns roles, dashboards will render correctly per role
- App shell and sidebar ready to receive real navigation targets as features are built in Phase 2+
- ComingSoonCard pattern established for placeholder features across all future dashboard pages

## Self-Check: PASSED

All key files verified. All task commits verified in git history.

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-08*
