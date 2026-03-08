---
phase: 01-foundation-and-auth
plan: 01
subsystem: infra
tags: [turborepo, pnpm, typescript, zod, express, react, vite, tailwindcss, monorepo]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - Turborepo monorepo with pnpm workspaces (apps/api, apps/web, packages/shared)
  - @ais/shared package with TypeScript types, Zod schemas, and route constants
  - Express API skeleton with health endpoint
  - React + Vite + Tailwind CSS v4 frontend skeleton
  - Shared tsconfig.base.json for consistent TypeScript configuration
affects: [01-02, 01-03, 01-04, all-future-plans]

# Tech tracking
tech-stack:
  added: [turbo@2.8.14, typescript@5.x, zod@3.x, express@4.x, react@19.x, vite@6.x, tailwindcss@4.x, "@clerk/react@6.x", "@clerk/express@2.x", cors@2.x, dotenv, svix@1.x, drizzle-orm@0.45.x, pg@8.x, tsx, vitest@3.x]
  patterns: [workspace-protocol, barrel-exports, const-object-enum, zod-schema-validation]

key-files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - tsconfig.base.json
    - .gitignore
    - .npmrc
    - packages/shared/package.json
    - packages/shared/tsconfig.json
    - packages/shared/src/index.ts
    - packages/shared/src/types/user.ts
    - packages/shared/src/types/company.ts
    - packages/shared/src/types/api.ts
    - packages/shared/src/schemas/company.ts
    - packages/shared/src/schemas/user.ts
    - packages/shared/src/constants/roles.ts
    - packages/shared/src/constants/routes.ts
    - apps/api/package.json
    - apps/api/tsconfig.json
    - apps/api/src/index.ts
    - apps/web/package.json
    - apps/web/tsconfig.json
    - apps/web/tsconfig.app.json
    - apps/web/tsconfig.node.json
    - apps/web/vite.config.ts
    - apps/web/index.html
    - apps/web/src/main.tsx
    - apps/web/src/App.tsx
    - apps/web/src/index.css
  modified: []

key-decisions:
  - "Used const object pattern for UserRole and CompanyType instead of TypeScript enums for better tree-shaking and type narrowing"
  - "Clerk React updated from v5 to v6 (Core 3 latest stable) since v5.61 is no longer published"
  - "Added @tailwindcss/vite plugin for Tailwind CSS v4 integration (v4 requires Vite plugin, not PostCSS)"
  - "Used explicit Express type annotation on app export to avoid non-portable type inference issue with pnpm strict mode"

patterns-established:
  - "Workspace protocol: all internal packages use workspace:* dependency"
  - "Barrel exports: each subdirectory has index.ts re-exporting all public API"
  - "Const object enum: UserRole and CompanyType use as const objects with derived type"
  - "Shared Zod schemas: validation schemas live in @ais/shared/schemas for frontend+backend reuse"
  - "API route constants: route paths centralized in @ais/shared/constants"
  - "Package exports map: @ais/shared uses exports field for subpath imports"

requirements-completed: [AUTH-04, AUTH-06]

# Metrics
duration: 4min
completed: 2026-03-08
---

# Phase 1 Plan 01: Monorepo Scaffolding Summary

**Turborepo monorepo with pnpm workspaces, @ais/shared type/schema/constant package, Express API skeleton, and React+Vite+Tailwind frontend skeleton**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-08T23:46:49Z
- **Completed:** 2026-03-08T23:50:34Z
- **Tasks:** 3
- **Files modified:** 31

## Accomplishments
- Turborepo monorepo with 3 workspace packages (apps/api, apps/web, packages/shared) building successfully
- @ais/shared package exports UserRole, CompanyType, Company, User, ApiResponse, Zod schemas (createCompanySchema, createUserSchema), and API route constants
- Express API skeleton with health endpoint wired to @ais/shared constants
- React 19 + Vite 6 + Tailwind CSS v4 frontend skeleton with @ais/shared wiring verified
- `pnpm install` resolves all workspaces and `turbo run build` completes without errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold monorepo root and workspace configs** - `fbc8e1c` (feat)
2. **Task 2: Create @ais/shared package with types, schemas, and constants** - `40ba8ac` (feat)
3. **Task 3: Create apps/api and apps/web skeletons with dependency wiring** - `ee6efad` (feat)

## Files Created/Modified
- `package.json` - Root package.json with turbo scripts and pnpm packageManager
- `pnpm-workspace.yaml` - Workspace definition for apps/* and packages/*
- `turbo.json` - Turborepo pipeline configuration (build, dev, lint, test, db tasks)
- `tsconfig.base.json` - Shared TypeScript config (ES2022, strict, bundler resolution)
- `.gitignore` - Ignores node_modules, dist, .env, .turbo, drizzle/meta
- `.npmrc` - pnpm strict mode (shamefully-hoist=false)
- `packages/shared/package.json` - @ais/shared package with exports map and zod dependency
- `packages/shared/tsconfig.json` - Extends base config for shared package
- `packages/shared/src/types/user.ts` - UserRole const object, User interface
- `packages/shared/src/types/company.ts` - CompanyType const object, Company interface
- `packages/shared/src/types/api.ts` - ApiResponse, ApiError, PaginatedResponse generics
- `packages/shared/src/schemas/company.ts` - createCompanySchema and updateCompanySchema (Zod)
- `packages/shared/src/schemas/user.ts` - createUserSchema (Zod)
- `packages/shared/src/constants/roles.ts` - ROLE_LABELS and ALL_ROLES
- `packages/shared/src/constants/routes.ts` - API_ROUTES constant
- `packages/shared/src/index.ts` - Barrel export for all shared code
- `apps/api/package.json` - Express API with all Phase 1 dependencies
- `apps/api/tsconfig.json` - API TypeScript config
- `apps/api/src/index.ts` - Express app with health endpoint using API_ROUTES
- `apps/web/package.json` - React frontend with Clerk, Tailwind, Vite
- `apps/web/tsconfig.json` - References app and node configs
- `apps/web/tsconfig.app.json` - React JSX TypeScript config
- `apps/web/tsconfig.node.json` - Vite config TypeScript config
- `apps/web/vite.config.ts` - Vite with Tailwind CSS v4 and React plugins
- `apps/web/index.html` - Root HTML with mount point
- `apps/web/src/main.tsx` - React entry point with @ais/shared wiring
- `apps/web/src/App.tsx` - Placeholder App component
- `apps/web/src/index.css` - Tailwind CSS v4 import

## Decisions Made
- **Clerk React v6 instead of v5:** The plan specified `@clerk/react@^5.61.0` but that version no longer exists on npm. Updated to `^6.0.0` (Core 3 stable) which is the latest.
- **Explicit Express type annotation:** Added `Express` type annotation to the `app` constant to avoid TS2742 error caused by non-portable inferred types in pnpm strict mode.
- **Tailwind CSS v4 Vite plugin:** Added `@tailwindcss/vite` package and configured it in `vite.config.ts` because Tailwind v4 uses a Vite plugin instead of PostCSS for integration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @clerk/react v5.61.0 no longer available on npm**
- **Found during:** Task 3 (apps/web dependency installation)
- **Issue:** `pnpm install` failed because `@clerk/react@^5.61.0` has no matching version; latest is `6.0.1`
- **Fix:** Updated dependency to `@clerk/react@^6.0.0`
- **Files modified:** apps/web/package.json
- **Verification:** pnpm install succeeds, turbo build passes
- **Committed in:** ee6efad (Task 3 commit)

**2. [Rule 1 - Bug] TypeScript TS2742 non-portable type inference on Express app export**
- **Found during:** Task 3 (turbo build)
- **Issue:** `export default app` inferred a type referencing `@types/express-serve-static-core` which is non-portable in pnpm strict mode
- **Fix:** Added explicit `Express` type import and annotation: `const app: Express = express()`
- **Files modified:** apps/api/src/index.ts
- **Verification:** tsc build passes without errors
- **Committed in:** ee6efad (Task 3 commit)

**3. [Rule 3 - Blocking] Tailwind CSS v4 requires @tailwindcss/vite plugin**
- **Found during:** Task 3 (turbo build)
- **Issue:** Vite build failed with `ENOENT: no such file or directory, open 'tailwindcss'` because `@import "tailwindcss"` needs the Vite plugin
- **Fix:** Installed `tailwindcss` and `@tailwindcss/vite`, added plugin to `vite.config.ts`
- **Files modified:** apps/web/package.json, apps/web/vite.config.ts
- **Verification:** Vite build completes successfully
- **Committed in:** ee6efad (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for build to pass. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Monorepo structure complete and building -- ready for 01-02 (PostgreSQL schema with Drizzle ORM)
- @ais/shared types and schemas ready for consumption by database schema definitions
- Express skeleton ready for API route and middleware additions
- React skeleton ready for Clerk provider, routing, and UI components

## Self-Check: PASSED

All 26 key files verified as existing. All 3 task commits verified in git history.
