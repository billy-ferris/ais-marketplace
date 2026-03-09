# Deferred Items - Phase 02.2

## Pre-existing Failures

### brands.test.ts mock initialization error
- **File:** apps/api/src/__tests__/routes/brands.test.ts
- **Error:** `Cannot access 'mockDb' before initialization` in vi.mock factory
- **Cause:** The mock factory references `mockDb` variable declared with `const` which is hoisted but not initialized when the factory runs
- **Impact:** All brands.test.ts stubs are currently `it.todo()` and the suite fails to load -- will be addressed in plan 02.2-02
- **Discovered during:** Plan 02.2-01 full suite verification
