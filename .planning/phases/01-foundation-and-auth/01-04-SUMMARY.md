---
phase: 01-foundation-and-auth
plan: 04
subsystem: auth
tags: [clerk, rbac, webhook, svix, seed-script, express-middleware, drizzle-orm]

# Dependency graph
requires:
  - phase: 01-foundation-and-auth/02
    provides: Drizzle schema (companies, users tables), database connection, Express API routes
  - phase: 01-foundation-and-auth/03
    provides: Frontend auth shell, Clerk login page, role-specific dashboards, useRole hook
provides:
  - RBAC middleware (requireRole, requireAuth) enforcing role-based API access
  - Clerk webhook handler verifying Svix signatures and syncing user lifecycle events to PostgreSQL
  - Seed script creating 5 companies and 5 users in both Clerk and local database
  - Protected API routes (admin-only writes, auth-required reads)
  - GET /api/users/me endpoint returning current user data
  - CustomJwtSessionClaims type declaration for Clerk session tokens
affects: [02-01, 02-02, 03-01, 04-02, 05-02, 06-02]

# Tech tracking
tech-stack:
  added: [svix]
  patterns: [clerk-webhook-svix-verification, rbac-middleware-chain, dual-sync-seed-pattern]

key-files:
  created:
    - apps/api/src/middleware/auth.ts
    - apps/api/src/routes/webhooks.ts
    - apps/api/src/db/seed.ts
    - apps/api/src/types/globals.d.ts
  modified:
    - apps/api/src/routes/companies.ts
    - apps/api/src/routes/users.ts
    - apps/api/src/index.ts
    - apps/api/src/db/index.ts
    - apps/api/src/db/schema/index.ts
    - apps/api/src/db/schema/relations.ts
    - apps/api/src/db/schema/users.ts
    - apps/web/src/pages/AdminDashboard.tsx

key-decisions:
  - "Used Drizzle Relations v1 (relations()) consistently with Plan 01-02 — v2 (defineRelations) not available in drizzle-orm 0.45.1"
  - "Removed .js import extensions across API files for drizzle-kit CJS compatibility"
  - "Admin dashboard consolidated: single Account Management card replaces separate User Management and Margin Settings cards"
  - "Clerk email verification code disabled in dashboard for dev environment — production would re-enable"

patterns-established:
  - "RBAC middleware pattern: requireRole(...roles) reads role from Clerk sessionClaims.metadata.role, returns 403 if unauthorized"
  - "Webhook raw body pattern: webhook route uses express.raw() mounted BEFORE express.json() to preserve raw body for Svix verification"
  - "Dual-sync seed pattern: seed script writes to both Clerk API and local PostgreSQL directly, bypassing webhook to avoid requiring public URL in dev"
  - "getCurrentUser helper: extracts userId, role, and sessionClaims from Clerk auth context for route handlers"

requirements-completed: [AUTH-01, AUTH-02, AUTH-04, AUTH-05, AUTH-07]

# Metrics
duration: ~30min
completed: 2026-03-09
---

# Phase 1 Plan 04: Clerk Backend Auth Summary

**RBAC middleware with Clerk session claims, Svix-verified webhook for user sync, and dual-sync seed script creating 5 companies and 5 demo users across Clerk and PostgreSQL**

## Performance

- **Duration:** ~30 min (across checkpoint)
- **Started:** 2026-03-09T01:30:00Z
- **Completed:** 2026-03-09T02:29:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 12

## Accomplishments
- RBAC middleware enforces role-based access on all API routes using Clerk session claims with publicMetadata
- Clerk webhook handler verifies Svix signatures and syncs user.created/updated/deleted events to local PostgreSQL users table
- Seed script creates 5 companies (varied margins: 8%, 10%, 12%) and 5 users (1 admin, 2 manufacturers, 2 retailers) in both Clerk and local database
- All three roles can log in and see correct role-specific dashboards with appropriate navigation
- Protected routes return 401 for unauthenticated and 403 for unauthorized requests
- GET /api/users/me endpoint enables current user data retrieval by Clerk ID

## Task Commits

Each task was committed atomically:

1. **Task 1: Build RBAC middleware, Clerk webhook handler, and protect API routes** - `4b4fe2a` (feat)
2. **Task 2: Create seed script for demo companies and users** - `a303388` (feat)
3. **Task 3: Verify end-to-end auth, email verification, and seed data** - checkpoint (human-verify, approved)

**Post-checkpoint fix:** `68e88ce` (fix) - Removed .js import extensions, updated seed data, consolidated admin dashboard

## Files Created/Modified
- `apps/api/src/middleware/auth.ts` - RBAC middleware: requireRole, requireAuth, getCurrentUser helpers using Clerk getAuth
- `apps/api/src/routes/webhooks.ts` - Clerk webhook handler with Svix signature verification, handles user.created/updated/deleted
- `apps/api/src/db/seed.ts` - Seed script creating 5 companies and 5 users in both Clerk and PostgreSQL with cleanup logic
- `apps/api/src/types/globals.d.ts` - CustomJwtSessionClaims type declaration for Clerk metadata.role
- `apps/api/src/routes/companies.ts` - Added requireAuth and requireRole('admin') to POST/PATCH routes
- `apps/api/src/routes/users.ts` - Added requireAuth to all routes, requireRole('admin') to GET list, added GET /me endpoint
- `apps/api/src/index.ts` - Webhook router mounted before express.json(), other routes after Clerk middleware
- `apps/api/src/db/index.ts` - Removed .js import extension for CJS compatibility
- `apps/api/src/db/schema/index.ts` - Removed .js import extensions for CJS compatibility
- `apps/api/src/db/schema/relations.ts` - Removed .js import extensions for CJS compatibility
- `apps/api/src/db/schema/users.ts` - Removed .js import extension for CJS compatibility
- `apps/web/src/pages/AdminDashboard.tsx` - Consolidated Account Management card (replaces User Management + Margin Settings)

## Decisions Made
- **Drizzle Relations v1 consistency:** Continued using relations() with one/many from Plan 01-02. The v2 defineRelations() API is not available in drizzle-orm 0.45.1.
- **Removed .js import extensions:** drizzle-kit runs as CJS and cannot resolve .js extensions in TypeScript source files. Removed all .js extensions from import paths across API files.
- **Admin dashboard consolidation:** Replaced separate "User Management" and "Margin Settings" Coming Soon cards with a single "Account Management" card for cleaner dashboard layout.
- **Clerk email verification for dev:** Disabled email verification code requirement in Clerk dashboard for development convenience. Production deployments would re-enable this setting.
- **Updated seed data:** Renamed "Luxe Beauty Co." to "Summit Home Appliances" and updated demo password from a breached credential.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed .js import extensions for drizzle-kit CJS compatibility**
- **Found during:** Task 3 (checkpoint verification)
- **Issue:** drizzle-kit runs as CJS and could not resolve .js import extensions in TypeScript source files, causing schema push failures
- **Fix:** Removed .js extensions from all import paths in API source files (db/index.ts, schema/index.ts, schema/relations.ts, schema/users.ts)
- **Files modified:** apps/api/src/db/index.ts, apps/api/src/db/schema/index.ts, apps/api/src/db/schema/relations.ts, apps/api/src/db/schema/users.ts
- **Verification:** drizzle-kit push succeeds, TypeScript still compiles cleanly
- **Committed in:** 68e88ce

### User-Requested Changes

**2. Seed data updates — renamed company and updated demo password**
- **Found during:** Task 3 (checkpoint verification)
- **Issue:** "Luxe Beauty Co." renamed to "Summit Home Appliances" per user preference; demo password updated from a breached credential
- **Fix:** Updated seed data arrays with new company name and secure demo password
- **Files modified:** apps/api/src/db/seed.ts
- **Committed in:** 68e88ce

**3. Admin dashboard consolidation**
- **Found during:** Task 3 (checkpoint verification)
- **Issue:** Separate "User Management" and "Margin Settings" cards were redundant
- **Fix:** Replaced with single "Account Management" Coming Soon card
- **Files modified:** apps/web/src/pages/AdminDashboard.tsx
- **Committed in:** 68e88ce

---

**Total deviations:** 3 (1 auto-fixed blocking, 2 user-requested changes)
**Impact on plan:** CJS compatibility fix was essential for drizzle-kit to work. Seed data and dashboard changes are cosmetic. No scope creep.

## Issues Encountered
- Clerk email verification code adds friction in local dev (must check email for every login). Disabled in Clerk dashboard for dev environment. This is a dashboard-level setting, not a code change.

## User Setup Required
**External services require manual configuration.** Clerk account must be configured with:
- Session token customization to include publicMetadata
- Webhook endpoint for user sync (requires public URL, e.g., via ngrok)
- Email verification toggle (enable for production, disable for dev)
- Sign-up disabled (invite-only via seed script)

Environment variables required: CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, CLERK_WEBHOOK_SIGNING_SECRET, VITE_CLERK_PUBLISHABLE_KEY, DATABASE_URL

## Next Phase Readiness
- Complete Phase 1 auth system operational: RBAC, webhook sync, seed data, login flows
- Plan 01-00 (test infrastructure) is the only remaining plan in Phase 1
- Phase 2 (Admin Catalog Management) can begin building on this auth foundation
- All API routes are protected and ready for feature endpoint additions
- Seed data provides demo environment with all three roles for testing

## Self-Check: PASSED

All 12 key files verified as existing. All 3 task commits (4b4fe2a, a303388, 68e88ce) verified in git history.

---
*Phase: 01-foundation-and-auth*
*Completed: 2026-03-09*
