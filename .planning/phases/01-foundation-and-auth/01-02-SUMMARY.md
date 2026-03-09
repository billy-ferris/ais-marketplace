---
phase: 01-foundation-and-auth
plan: 02
subsystem: database
tags: [drizzle-orm, postgresql, pgEnum, express, api-routes, companies, users]

# Dependency graph
requires:
  - phase: 01-foundation-and-auth
    provides: Turborepo monorepo with @ais/shared types, schemas, and Express skeleton
provides:
  - Companies table definition with pgEnum, identity column, all fields
  - Users table definition with clerkId unique, companyId FK
  - Drizzle relations defining user-company relationship
  - Database connection instance via drizzle-orm/node-postgres
  - Drizzle Kit configuration for push/generate/migrate
  - Company CRUD API routes (GET list, GET by ID, POST create, PATCH update)
  - User read API routes (GET list with company relation, GET by ID with company relation)
  - Error handler middleware with Zod validation error formatting
affects: [01-03, 01-04, 02-01, 02-02, all-api-routes]

# Tech tracking
tech-stack:
  added: []
  patterns: [drizzle-schema-identity-columns, pgEnum-for-enums, drizzle-relational-queries, express-router-type-annotation, zod-error-middleware]

key-files:
  created:
    - apps/api/src/db/schema/companies.ts
    - apps/api/src/db/schema/users.ts
    - apps/api/src/db/schema/relations.ts
    - apps/api/src/db/schema/index.ts
    - apps/api/src/db/index.ts
    - apps/api/drizzle.config.ts
    - apps/api/.env.example
    - apps/api/src/middleware/error.ts
    - apps/api/src/routes/companies.ts
    - apps/api/src/routes/users.ts
  modified:
    - apps/api/src/index.ts

key-decisions:
  - "Used Drizzle Relations v1 (relations() with one/many) instead of v2 (defineRelations) because v2 is not available in drizzle-orm 0.45.1"
  - "Used drizzle() with connection string instead of explicit Pool for simpler database initialization"
  - "Added explicit Router type annotation to avoid TS2742 non-portable type inference in pnpm strict mode"

patterns-established:
  - "Drizzle schema pattern: pgEnum + pgTable with identity columns, snake_case DB columns, camelCase TS fields"
  - "Express Router pattern: explicit RouterType annotation for pnpm strict mode compatibility"
  - "Error middleware pattern: Zod errors return 400 with formatted details, other errors pass through"
  - "Route handler pattern: try/catch with next(err) for centralized error handling"

requirements-completed: [AUTH-06, AUTH-07]

# Metrics
duration: 5min
completed: 2026-03-09
---

# Phase 1 Plan 02: PostgreSQL Schema and API Routes Summary

**Drizzle ORM schema with companies/users tables, pgEnum constraints, identity columns, bidirectional relations, and Express CRUD routes with Zod validation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-08T23:57:51Z
- **Completed:** 2026-03-09T00:02:50Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Companies table with all required fields: name, type (pgEnum), marginPercentage (numeric 5,2 default 10.00), contactName, phone, structured address, timestamps
- Users table with clerkId (unique), email (unique), role (pgEnum), companyId FK to companies, timestamps
- Drizzle relations defining bidirectional user-company relationship (one user to one company, one company to many users)
- Company CRUD API routes: GET all, GET by ID, POST create with Zod validation, PATCH update with Zod validation
- User read API routes: GET all with company eager loading, GET by ID with company eager loading
- Express app updated with Clerk middleware, route mounting, and error handler in correct order

## Task Commits

Each task was committed atomically:

1. **Task 1: Define Drizzle schema tables, relations, and database connection** - `b3dea1d` (feat)
2. **Task 2: Create Express API routes for companies and users, update app entry** - `9804c47` (feat)

## Files Created/Modified
- `apps/api/src/db/schema/companies.ts` - Companies table with pgEnum, identity column, all fields
- `apps/api/src/db/schema/users.ts` - Users table with clerkId unique, companyId FK to companies
- `apps/api/src/db/schema/relations.ts` - Drizzle relations v1 defining user-company bidirectional relationship
- `apps/api/src/db/schema/index.ts` - Barrel re-export of all schema modules
- `apps/api/src/db/index.ts` - Database connection instance using drizzle-orm/node-postgres
- `apps/api/drizzle.config.ts` - Drizzle Kit config for push/generate/migrate
- `apps/api/.env.example` - Environment variable template with DATABASE_URL, Clerk keys, etc.
- `apps/api/src/middleware/error.ts` - Express error handler with Zod validation error formatting
- `apps/api/src/routes/companies.ts` - Company CRUD routes (GET list, GET by ID, POST, PATCH)
- `apps/api/src/routes/users.ts` - User read routes (GET list, GET by ID) with company relation
- `apps/api/src/index.ts` - Updated app entry with Clerk middleware, routes, error handler

## Decisions Made
- **Drizzle Relations v1 instead of v2:** Plan specified `defineRelations()` (Relations v2) but it does not exist in drizzle-orm 0.45.1. Used the v1 `relations()` function with `one()` and `many()` helpers, which provides the same bidirectional relationship definition. This is functionally equivalent.
- **Connection string initialization:** Used `drizzle(process.env.DATABASE_URL!, { schema })` instead of creating an explicit `Pool` instance -- simpler and drizzle handles connection pooling internally.
- **Explicit Router type annotation:** Added `type Router as RouterType` import and type annotation on router constants to prevent TS2742 non-portable type inference error in pnpm strict mode.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] defineRelations() (Relations v2) does not exist in drizzle-orm 0.45.1**
- **Found during:** Task 1 (relations.ts creation)
- **Issue:** Plan and research doc recommended `defineRelations()` from Relations v2, but this function is not exported by drizzle-orm 0.45.1. Only the v1 `relations()` function exists.
- **Fix:** Used Drizzle Relations v1 API with `relations()`, `one()`, and `many()` helpers. Defines the same bidirectional user-company relationship with `fields` and `references` arrays.
- **Files modified:** apps/api/src/db/schema/relations.ts
- **Verification:** TypeScript compiles cleanly, relational queries work (db.query.users.findMany with company relation)
- **Committed in:** b3dea1d (Task 1 commit)

**2. [Rule 1 - Bug] TS2742 non-portable type inference on Express Router exports**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** `const router = Router()` inferred a type referencing `@types/express-serve-static-core` which is non-portable in pnpm strict mode
- **Fix:** Added explicit `Router as RouterType` import and type annotation: `const router: RouterType = Router()`
- **Files modified:** apps/api/src/routes/companies.ts, apps/api/src/routes/users.ts
- **Verification:** tsc --noEmit passes without errors
- **Committed in:** 9804c47 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Relations v1 provides identical functionality to v2 for this use case. Router type annotation is a pattern established in Plan 01. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required. Database connection requires DATABASE_URL environment variable at runtime (see .env.example).

## Next Phase Readiness
- Database schema complete and compiling -- ready for Plan 03 (Clerk backend auth, webhook, seed script)
- Company CRUD routes ready for auth middleware addition in Plan 03
- User routes ready for auth protection in Plan 03
- Drizzle Kit config ready for `db:push` once DATABASE_URL is configured

## Self-Check: PASSED

All 11 key files verified as existing. All 2 task commits verified in git history.
