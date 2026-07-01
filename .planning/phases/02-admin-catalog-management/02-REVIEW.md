---
phase: 02-admin-catalog-management
reviewed: 2026-07-01T02:58:10Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - apps/api/src/routes/uploads.ts
  - apps/api/src/db/seed.ts
  - apps/api/src/db/schema/brands.ts
  - apps/api/src/db/schema/categories.ts
  - apps/api/src/db/schema/inventory-skus.ts
  - apps/api/src/db/schema/brand-listing-images.ts
  - apps/api/src/db/schema/listing-categories.ts
  - apps/api/src/__tests__/rbac.test.ts
  - apps/api/src/__tests__/schema.test.ts
  - apps/web/src/App.tsx
  - apps/web/src/components/layout/AppSidebar.tsx
  - apps/web/src/components/manage/columns/category-columns.tsx
  - apps/web/src/components/shared/ConfirmDeleteDialog.tsx
  - apps/web/src/components/shared/ImagePlaceholder.tsx
  - apps/web/src/components/shared/ImageUploader.tsx
  - apps/web/src/hooks/useDebounce.ts
  - apps/web/src/hooks/useUpload.ts
  - apps/web/src/pages/manage/CategoriesPage.tsx
  - packages/shared/src/constants/catalog.ts
  - packages/shared/src/schemas/category.ts
  - packages/shared/src/schemas/inventory-sku.ts
findings:
  critical: 2
  warning: 7
  info: 3
  total: 12
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-07-01T02:58:10Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

This pass covers the files unique to phase 02 that were excluded from the 02.1/02.3 retroactive reviews: R2 upload handling, Drizzle catalog schema definitions, the shared Zod schemas for categories/SKUs, and the seed script. Cross-referenced against existing tests (`apps/api/src/__tests__/routes/uploads.test.ts`, `apps/api/src/__tests__/schemas/catalog.test.ts`, `apps/api/src/__tests__/seed/categories.test.ts`) to confirm each finding is real and not already covered.

Two blockers: the seed script has no environment guard before performing destructive deletes against `DATABASE_URL`/Clerk, and the `brands`/`categories` schemas define a soft-delete (`deletedAt`) pattern that is broken by a plain (non-partial) unique constraint on `slug`, meaning a soft-deleted category/brand permanently blocks recreation of the same slug. The remaining findings are concentrated in the R2 upload path (no server-side content-type/size validation, no client-side type validation, and a silently-swallowed upload failure) and in FK/constraint gaps in the catalog schema.

## Critical Issues

### CR-01: Seed script has no environment guard before destructive deletes

**File:** `apps/api/src/db/seed.ts:378-400`
**Issue:** `main()` unconditionally runs `db.delete(listingCategories)`, `db.delete(brandListingImages)`, `db.delete(inventorySkus)`, `db.delete(brandListings)`, `db.delete(brands)`, `db.delete(categories)`, `db.delete(users)`, `db.delete(companies)`, and `cleanClerkUsers()` (which calls `clerk.users.deleteUser(...)` for every seed email found in the connected Clerk instance) with no check on `NODE_ENV`, no confirmation prompt, and no assertion that `DATABASE_URL`/`CLERK_SECRET_KEY` point at a non-production instance. `package.json` invokes this via a plain `tsx src/db/seed.ts` (`db:seed` script) with no guard either. If this script is ever run with production credentials in the environment (e.g. a misconfigured `.env`, a copy-pasted `DATABASE_URL`, or CI misconfiguration), it silently wipes the entire catalog, all local users/companies, and deletes the corresponding users from Clerk — unrecoverable data loss.
**Fix:**
```ts
// top of main(), before any deletes
if (process.env.NODE_ENV === 'production' || process.env.ALLOW_SEED_PROD !== undefined) {
  console.error('Refusing to run destructive seed script against a production-flagged environment.');
  process.exit(1);
}
// Consider also asserting DATABASE_URL/CLERK_SECRET_KEY hostnames don't match known prod values,
// or gating behind a required --force / confirmation prompt.
```

### CR-02: Unique `slug` constraint conflicts with soft-delete pattern on brands/categories

**File:** `apps/api/src/db/schema/brands.ts:13,21`, `apps/api/src/db/schema/categories.ts:11,16`
**Issue:** Both tables define `slug: varchar(...).notNull().unique()` alongside a `deletedAt: timestamp('deleted_at')` soft-delete column. A plain unique constraint is enforced by Postgres regardless of `deletedAt`, so once a brand/category is soft-deleted, its slug is permanently reserved — any attempt to create a new brand/category with the same slug fails with a unique-constraint violation, even though the row is "deleted". This directly contradicts the documented UX: `CategoriesPage.tsx:127` tells admins "This action can be undone by an administrator," implying the row is expected to be recoverable/replaceable, but the schema makes the slug itself un-reusable while the soft-deleted row exists.
**Fix:**
```ts
// Use a partial unique index that only applies to non-deleted rows:
import { uniqueIndex, isNull } from 'drizzle-orm/pg-core';
// ...
}, (table) => [
  uniqueIndex('brands_slug_active_unique')
    .on(table.slug)
    .where(isNull(table.deletedAt)),
]);
```
(Apply the same fix to `categories.ts`.)

## Warnings

### WR-01: R2 upload route accepts any `contentType` and enforces no server-side size limit

**File:** `apps/api/src/routes/uploads.ts:35-51`
**Issue:** `POST /presigned-url` only checks that `fileName` and `contentType` are present (truthy), not that `contentType` is an actual image MIME type. Whatever string the client sends is passed straight to `PutObjectCommand({ ContentType: contentType, ... })` (confirmed by `apps/api/src/__tests__/routes/uploads.test.ts:119-129`, which shows arbitrary content types flow through unchecked). There is also no `ContentLength`/size constraint on the presigned PUT, so the 10-minute presigned URL can be used to upload arbitrarily large or non-image objects (e.g. `text/html`, executables) to the public bucket.
**Fix:**
```ts
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
  res.status(400).json({ error: 'Unsupported content type' });
  return;
}

const command = new PutObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: key,
  ContentType: contentType,
  // S3-compatible presigned PUTs can also enforce size via a POST policy;
  // at minimum, validate Content-Length server-side after upload confirmation.
});
```

### WR-02: `useUpload.uploadFile` does not check the R2 PUT response before returning success

**File:** `apps/web/src/hooks/useUpload.ts:29-35`
**Issue:** After obtaining the presigned URL, the hook does `await fetch(uploadUrl, { method: 'PUT', body: file, ... })` and immediately returns `publicUrl` without checking `response.ok`/`response.status`. If the PUT fails (network error resolves without throwing on non-2xx, R2 permission issue, expired signature, CORS failure that still resolves in some browsers, etc.), the caller receives a "successful" `publicUrl` and will persist a reference to an image that was never actually uploaded, resulting in a silently broken image in the catalog.
**Fix:**
```ts
const uploadRes = await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
});
if (!uploadRes.ok) {
  throw new Error(`Upload to storage failed: ${uploadRes.status}`);
}
return publicUrl;
```

### WR-03: `ImageUploader` never validates file type — drag-and-drop bypasses even the picker hint

**File:** `apps/web/src/components/shared/ImageUploader.tsx:31-41`
**Issue:** `handleFile()` only validates `file.size` against `maxSizeMB`; it never checks `file.type`. The `accept="image/*"` attribute on the `<input type="file">` (line 143) is merely a hint for the native file picker dialog and is not enforced on `handleDrop` (lines 52-62), which reads directly from `e.dataTransfer.files[0]`. A user can drag any non-image file onto the widget and it will be passed to `onChange`/`useUpload` unfiltered. Combined with WR-01 (no server-side validation either), nothing in the pipeline actually verifies the uploaded content is an image.
**Fix:**
```ts
function handleFile(file: File) {
  setError(null);
  if (accept !== '*/*' && !file.type.startsWith('image/')) {
    setError('Only image files are allowed');
    return;
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    setError(`File size must be less than ${maxSizeMB}MB`);
    return;
  }
  onChange(file);
}
```

### WR-04: Catalog FKs omit `onDelete` behavior, defaulting to Postgres `NO ACTION`

**File:** `apps/api/src/db/schema/brands.ts:16-18`, `apps/api/src/db/schema/inventory-skus.ts:12-14`, `apps/api/src/db/schema/brand-listing-images.ts:12-14`, `apps/api/src/db/schema/listing-categories.ts:12-17`
**Issue:** None of `brands.companyId`, `inventorySkus.listingId`, `brandListingImages.listingId`, `listingCategories.listingId`, or `listingCategories.categoryId` specify `onDelete`. Drizzle/Postgres defaults this to `NO ACTION`, meaning any hard delete of a parent row (a company, listing, or category) that still has children will fail with a raw, unhandled foreign-key-violation error rather than cascading or being rejected with a clean application-level message. This is inconsistent with the soft-delete (`deletedAt`) pattern used elsewhere in the same tables — the schema doesn't declare an explicit strategy either way, so any future hard-delete code path (including `seed.ts`'s own cleanup, which only works today because deletes are manually ordered child-before-parent) is one refactor away from surfacing a raw DB error to the caller.
**Fix:** Decide and encode the intended behavior explicitly, e.g.:
```ts
listingId: integer('listing_id')
  .notNull()
  .references(() => brandListings.id, { onDelete: 'cascade' }), // or 'restrict', explicitly
```

### WR-05: No constraint prevents multiple `isPrimary` images per listing

**File:** `apps/api/src/db/schema/brand-listing-images.ts:17`
**Issue:** `isPrimary: boolean('is_primary').notNull().default(false)` has no accompanying unique/partial index scoped to `listingId`. Nothing at the schema (or, per scope, reviewed application) level prevents two or more rows for the same `listingId` from having `isPrimary = true` simultaneously, which breaks any "get the primary image" query that assumes at most one match.
**Fix:**
```ts
}, (table) => [
  uniqueIndex('brand_listing_images_one_primary_per_listing')
    .on(table.listingId)
    .where(sql`${table.isPrimary} = true`),
]);
```

### WR-06: SKU price/msrp Zod validation not bounded to the DB's `numeric(10,2)` precision

**File:** `packages/shared/src/schemas/inventory-sku.ts:10-15`
**Issue:** `price`/`msrp` use `/^\d+(\.\d{1,2})?$/`, which accepts any number of integer digits. The corresponding DB columns (`apps/api/src/db/schema/inventory-skus.ts:21-22`) are `numeric({ precision: 10, scale: 2 })`, i.e. max 8 integer digits. A value like `"123456789.99"` passes Zod validation but will fail at insert time with a raw Postgres numeric field overflow error, surfacing as an unhandled 500 instead of a clean 400 validation error.
**Fix:**
```ts
price: z
  .string()
  .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Must be a decimal number up to 8 integer digits (e.g., "12.99")'),
```

### WR-07: `cleanClerkUsers` silently swallows all errors, not just "not found"

**File:** `apps/api/src/db/seed.ts:357-372`
**Issue:** The `try { ... } catch { /* User not found — nothing to clean */ }` block around `clerk.users.getUserList`/`deleteUser` catches every possible error — network failures, Clerk API rate limiting, auth/config errors — and treats them all as "user not found". If the Clerk API key is misconfigured or a request is throttled, cleanup silently no-ops and the script proceeds as if state were clean, which can then produce confusing 409s later in `createUser` (masked by the existing 409/422 handling) with no indication of the real root cause.
**Fix:**
```ts
} catch (err: unknown) {
  const error = err as { status?: number };
  if (error.status !== 404) {
    console.warn(`  Warning: unexpected error cleaning up ${seedUser.email}:`, err);
  }
}
```

## Info

### IN-01: Optional SKU string fields accept empty string instead of enforcing a minimum length

**File:** `packages/shared/src/schemas/inventory-sku.ts:6-7`
**Issue:** `sku`, `upc`, and `size` are declared as `z.string().max(N).optional()` with no `.min(1)`. An explicitly-sent empty string (`""`) passes validation and gets persisted as a literal empty string in the DB, which is a different representation than simply omitting the field (which leaves the column `null`). This produces inconsistent "no value" semantics between the two code paths.
**Fix:** `sku: z.string().min(1).max(100).optional()` (repeat for `upc`, `size`), or explicitly `.transform((v) => (v === '' ? undefined : v))` before the length checks.

### IN-02: `sanitizeFileName` does not cap output length

**File:** `apps/api/src/routes/uploads.ts:21-26`
**Issue:** The sanitizer strips disallowed characters but never truncates the result, so an unusually long `fileName` (e.g. thousands of characters) produces an equally long R2 object key with no upper bound.
**Fix:** `return sanitized.slice(0, 200);` (or similar) after the existing replacements.

### IN-03: Hardcoded demo password logged to stdout in seed script

**File:** `apps/api/src/db/seed.ts:20,558`
**Issue:** `DEMO_PASSWORD = 'AisMarket2026!'` is hardcoded and printed to the console for every seed run. Acceptable for local/demo seeding, but flagging per the standard hardcoded-credential pattern in case this script is ever run against a shared/staging environment reachable outside the local dev network.
**Fix:** No action required for local dev use; if this script is ever wired into a shared staging pipeline, source the password from an env var instead of a literal.

---

_Reviewed: 2026-07-01T02:58:10Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
