---
phase: 01-foundation-and-auth
reviewed: 2026-06-30T00:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - apps/api/src/routes/webhooks.ts
  - apps/api/src/routes/users.ts
  - apps/api/src/routes/companies.ts
  - apps/api/src/db/index.ts
  - apps/api/src/db/schema/users.ts
  - apps/api/src/db/schema/companies.ts
  - apps/api/src/types/globals.d.ts
  - apps/api/drizzle.config.ts
  - apps/api/vitest.config.ts
  - apps/api/src/__tests__/setup.ts
  - apps/web/src/main.tsx
  - apps/web/src/components/shared/RoleGuard.tsx
  - apps/web/src/components/layout/DashboardLayout.tsx
  - apps/web/src/components/shared/ComingSoonCard.tsx
  - apps/web/src/hooks/useRole.ts
  - apps/web/src/hooks/useIsMobile.ts
  - apps/web/src/lib/utils.ts
  - apps/web/src/pages/AdminDashboard.tsx
  - apps/web/src/pages/ManufacturerDashboard.tsx
  - apps/web/src/pages/RetailerDashboard.tsx
  - apps/web/src/pages/LoginPage.tsx
  - apps/web/src/pages/ForbiddenPage.tsx
  - apps/web/src/pages/NotFoundPage.tsx
  - apps/web/vite.config.ts
  - packages/shared/src/constants/roles.ts
  - packages/shared/src/schemas/user.ts
  - packages/shared/src/schemas/company.ts
  - packages/shared/src/types/user.ts
  - packages/shared/src/types/company.ts
  - packages/shared/src/types/api.ts
findings:
  critical: 2
  warning: 4
  info: 3
  total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-06-30T00:00:00Z
**Depth:** standard
**Files Reviewed:** 25 (unique to phase 01; `middleware/auth.ts` and `middleware/error.ts` excluded per scope — reviewed in later passes)
**Status:** issues_found

## Summary

Reviewed the Clerk webhook sync handler, `users`/`companies` route authorization, DB schema, RBAC client-side gating, and shared types/schemas that constitute phase 01's foundation layer.

The Svix webhook signature verification itself is implemented correctly: `express.raw()` is mounted at the route level before the global `express.json()` (confirmed in `apps/api/src/index.ts`), and `Webhook(secret).verify(req.body, headers)` runs inside a try/catch that rejects with 400 on failure before any DB write occurs. That part is sound.

The two Critical findings are both **authorization scoping gaps** in the REST routes, not the webhook: `GET /users/:id` and the `companies` GET endpoints allow any authenticated user (any role) to read PII and commercially sensitive data (email addresses, per-company margin percentage, contact/phone info) for every other user/company in the system, with no ownership or role scoping — while the corresponding "list" endpoints were deliberately admin-gated, suggesting this is an oversight rather than a deliberate design choice. There is also a dead/unused `RoleGuard` component that was never wired into the router, meaning none of the client routes actually apply role-based UI gating (this is not itself a server-side vulnerability, but it indicates an intended control was never connected, and the burden for authorization now rests entirely on the API — which itself has gaps per above).

## Critical Issues

### CR-01: `GET /users/:id` allows any authenticated user to enumerate all users' PII (IDOR)

**File:** `apps/api/src/routes/users.ts:48-70`
**Issue:** `router.get('/:id', requireAuth(), ...)` has no role or ownership check — only `requireAuth()` is applied. Any authenticated user of any role (retailer, manufacturer) can iterate numeric IDs (`/api/users/1`, `/api/users/2`, ...) and retrieve every other user's `email`, `firstName`, `lastName`, `role`, and `companyId` plus the full related `company` record.

This is inconsistent with `GET /` (line 36), which is explicitly `requireRole('admin')`-gated — the bulk-listing endpoint was clearly intended to be admin-only, but the single-record lookup provides an equivalent (if slower) path to the same data with no role restriction at all, effectively bypassing the intended admin-only restriction via enumeration.

**Fix:** Either restrict to admin, or scope to "self or admin":
```ts
router.get('/:id', requireAuth(), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const { userId, role } = getCurrentUser(req);
    const requestedUser = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!requestedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (role !== 'admin' && requestedUser.clerkId !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    // ... proceed with the `with: { company: true }` query
  } catch (err) {
    next(err);
  }
});
```

### CR-02: `companies` GET endpoints expose commercially sensitive data to any authenticated user

**File:** `apps/api/src/routes/companies.ts:14-46`
**Issue:** `GET /` and `GET /:id` are `requireAuth()`-only (no role/ownership scoping). Both return the full `companies` row, including `marginPercentage` (the per-company commission/margin rate — commercially sensitive contractual data), `contactName`, and `phone`. This means, e.g., a retailer-role account can read every manufacturer's (and every other retailer's) margin rate and direct contact/phone info, and vice versa. There's no filtering by the requester's own company or by role.
**Fix:** At minimum, restrict `marginPercentage` to admin/self-company visibility, e.g. via a response-shaping function or a separate admin-only field selection:
```ts
router.get('/', requireAuth(), async (req, res, next) => {
  try {
    const { role } = getCurrentUser(req);
    const result = await db.select().from(companies);
    const sanitized = role === 'admin'
      ? result
      : result.map(({ marginPercentage, phone, ...rest }) => rest);
    res.json(sanitized);
  } catch (err) {
    next(err);
  }
});
```
Apply the same treatment to `GET /:id`. If non-admin users legitimately need to see other companies' contact info for trading, keep that but strip `marginPercentage`.

## Warnings

### WR-01: Webhook trusts `email_addresses[0]` as the user's canonical email instead of the Clerk-designated primary

**File:** `apps/api/src/routes/webhooks.ts:53-64, 83-93`
**Issue:** Both `user.created` and `user.updated` handlers do `emailAddresses[0]?.email_address`. Clerk's webhook payload does not guarantee index `0` is the user's primary email — the payload includes `primary_email_address_id` specifically because array order is not authoritative (a user with multiple linked emails, or one who adds a new unverified address, can shift what's at index 0). Syncing the wrong (possibly unverified) email into the `users.email` unique column can misroute account-related communication and, since `email` is `unique().notNull()`, a later attempt to correctly sync a different user whose true primary email collides with a stale wrong value already stored will fail with a DB constraint error.
**Fix:**
```ts
const primaryId = data.primary_email_address_id as string | undefined;
const primaryEmail = emailAddresses.find(e => e.id === primaryId)?.email_address
  ?? emailAddresses[0]?.email_address
  ?? '';
```

### WR-02: Webhook role from `public_metadata` is cast, not validated, before a DB write

**File:** `apps/api/src/routes/webhooks.ts:56-58, 66-67, 86-88, 95-96`
**Issue:** `publicMetadata?.role as 'admin' | 'manufacturer' | 'retailer'` is a type-level assertion only — there's no runtime check that the value is actually one of the three enum members. `@ais/shared` already exports a zod schema (`createUserSchema`) with `role: z.enum([...])` that could validate this. If Clerk metadata ever contains an unexpected value (manual dashboard typo, future metadata shape change), the `INSERT`/`UPDATE` will fail against the Postgres enum constraint, get caught by the outer catch, return a 500, and Clerk will retry the webhook indefinitely without ever succeeding — a silent, hard-to-diagnose sync failure.
**Fix:** Validate against `ALL_ROLES` from `@ais/shared` (or the exported zod schema) and fall back to `'retailer'` on invalid values, logging a warning:
```ts
import { ALL_ROLES } from '@ais/shared';
const rawRole = publicMetadata?.role;
const role = ALL_ROLES.includes(rawRole as any) ? rawRole : 'retailer';
if (publicMetadata?.role && role === 'retailer' && rawRole !== 'retailer') {
  console.warn(`Unrecognized role "${rawRole}" in webhook payload for user ${data.id}, defaulting to retailer`);
}
```

### WR-03: `RoleGuard` component is defined but never used — no client-side route is role-gated

**File:** `apps/web/src/components/shared/RoleGuard.tsx` (whole file); confirmed via `apps/web/src/lib/router.tsx`
**Issue:** `RoleGuard` is exported but has zero importers anywhere in `apps/web/src` (verified by repo-wide grep). The router (`apps/web/src/lib/router.tsx`) mounts `/manage/brands`, `/manage/listings`, `/manage/approvals`, etc. with no role gating at all — every authenticated user can navigate directly to those routes in the browser regardless of role. `DashboardLayout` does branch by role for the `/` index route, but that's a separate, ad-hoc mechanism, not `RoleGuard`. Since server-side authorization is the real boundary, this is not itself an exploitable vulnerability, but it means an intended reusable access-control primitive was built and then never wired up — the UI currently relies entirely on downstream API 403s to prevent unauthorized actions, with no client-side guard to prevent a confusing/broken UI state for e.g. a retailer landing on an admin-only management page.
**Fix:** Either wire `RoleGuard` into the `/manage/*` route tree (e.g., wrap each element or wrap a parent layout route), or remove it if it's genuinely unneeded and role-appropriate routing will be handled another way — don't leave an unused security-adjacent component in the tree.

### WR-04: No test coverage exists for `webhooks.ts`, `users.ts`, or `companies.ts` routes

**File:** `apps/api/src/routes/webhooks.ts`, `apps/api/src/routes/users.ts`, `apps/api/src/routes/companies.ts`
**Issue:** `apps/api/src/__tests__/` contains `rbac.test.ts` (covers `requireRole`/`requireAuth` middleware directly) plus route tests for `brands`, `categories`, `listings`, `notifications`, and `uploads` — but there are no equivalent test files for the webhook handler (signature verification success/failure paths, `user.created`/`user.updated`/`user.deleted` event handling) or for the `users`/`companies` route authorization behavior covered by CR-01/CR-02. Per this project's established practice (all `apps/api` routes get test coverage), this is a gap that predates the later-phase test-population passes and should be closed, especially given the signature-verification and authorization logic identified above.
**Fix:** Add `apps/api/src/__tests__/routes/webhooks.test.ts` (mock `svix`'s `Webhook.verify` to test both valid/invalid signature paths and each event type) and `users.test.ts`/`companies.test.ts` (mock `getAuth`/db to assert the role/ownership behavior, especially regression tests for CR-01/CR-02 once fixed).

## Info

### IN-01: `createUserSchema` (packages/shared) is exported but never imported anywhere

**File:** `packages/shared/src/schemas/user.ts:3-11`
**Issue:** `createUserSchema` is exported from `@ais/shared` (via `schemas/index.ts` and the package root `index.ts`) but there is no `POST /users` route (users are only created via the Clerk webhook) and no frontend usage — repo-wide grep finds only the definition and its re-exports, no consumers.
**Fix:** Either remove it if user creation will always go through the webhook, or use it in the webhook handler to validate `public_metadata.role` (see WR-02) so the schema earns its keep.

### IN-02: `db/index.ts` uses a silent non-null assertion for `DATABASE_URL` instead of a clear startup error

**File:** `apps/api/src/db/index.ts:4`
**Issue:** `drizzle(process.env.DATABASE_URL!, { schema })` will, if `DATABASE_URL` is unset, pass `undefined` through the non-null assertion with no explicit check — producing whatever opaque error `drizzle`/the underlying `pg` driver throws, rather than a clear developer-facing message. Contrast with `apps/web/src/main.tsx:9-11`, which explicitly checks `VITE_CLERK_PUBLISHABLE_KEY` and throws a clear message. This is a minor inconsistency in error-reporting quality across the codebase, not a functional bug.
**Fix:**
```ts
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL environment variable');
}
const db = drizzle(databaseUrl, { schema });
```

### IN-03: `webhooks.ts` casts possibly-missing Svix headers to `string` without a runtime presence check

**File:** `apps/api/src/routes/webhooks.ts:31-35`
**Issue:** `req.headers['svix-id'] as string` (and the timestamp/signature siblings) type-asserts a value that could be `undefined` at runtime if the header is absent from the request. Functionally this is safe today — `wh.verify()` will throw on missing/invalid headers and the surrounding try/catch converts that into a 400 — but the `as string` cast masks the actual possible-`undefined` type and could hide a future refactor bug if verification logic changes.
**Fix:** Use explicit optional typing and let TypeScript's control flow narrow it, or validate presence before constructing the headers object:
```ts
const svixId = req.headers['svix-id'];
const svixTimestamp = req.headers['svix-timestamp'];
const svixSignature = req.headers['svix-signature'];
if (typeof svixId !== 'string' || typeof svixTimestamp !== 'string' || typeof svixSignature !== 'string') {
  res.status(400).json({ error: 'Missing Svix headers' });
  return;
}
```

---

_Reviewed: 2026-06-30T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
