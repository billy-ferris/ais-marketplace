# Deferred Items — Phase 02.3

Out-of-scope discoveries logged during execution. Do NOT fix within their discovering plan.

## From Plan 02.3-01

- **Pre-existing test failure:** `apps/api/src/__tests__/schemas/catalog.test.ts > Catalog Zod Schemas > createBrandSchema > should require companyId as positive integer`.
  - Verified pre-existing: fails at base commit `807ee43` before any error.ts change.
  - Unrelated to this plan (schema validation, not the error-middleware contract).
  - `createBrandSchema` apparently does not reject a missing/negative `companyId` as the test expects. Needs a schema fix in a future catalog/validation plan.
