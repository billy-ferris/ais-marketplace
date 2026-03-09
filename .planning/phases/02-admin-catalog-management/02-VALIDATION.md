---
phase: 2
slug: admin-catalog-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | apps/api/vitest.config.ts |
| **Quick run command** | `cd apps/api && pnpm test` |
| **Full suite command** | `pnpm test` (root turborepo) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && pnpm test`
- **After every plan wave:** Run `pnpm test` (root turborepo)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | ADMN-01a | unit | `cd apps/api && npx vitest run src/__tests__/routes/brands.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ADMN-01b | unit | `cd apps/api && npx vitest run src/__tests__/routes/categories.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | ADMN-01c | unit | `cd apps/api && npx vitest run src/__tests__/routes/listings.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | ADMN-01d | unit | `cd apps/api && npx vitest run src/__tests__/routes/uploads.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | ADMN-01e | unit | `cd apps/api && npx vitest run src/__tests__/schemas/catalog.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | ADMN-02a | unit | `cd apps/api && npx vitest run src/__tests__/seed/categories.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | ADMN-02b | unit | `cd apps/api && npx vitest run src/__tests__/routes/brands.test.ts -t "soft delete"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/__tests__/routes/brands.test.ts` — stubs for ADMN-01a, ADMN-02b
- [ ] `apps/api/src/__tests__/routes/categories.test.ts` — stubs for ADMN-01b
- [ ] `apps/api/src/__tests__/routes/listings.test.ts` — stubs for ADMN-01c
- [ ] `apps/api/src/__tests__/routes/uploads.test.ts` — stubs for ADMN-01d
- [ ] `apps/api/src/__tests__/schemas/catalog.test.ts` — stubs for ADMN-01e
- [ ] `apps/api/src/__tests__/seed/categories.test.ts` — stubs for ADMN-02a
- [ ] Test setup: DB mocking strategy (mock drizzle `db` object or use test database)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin UI renders data table with correct columns | ADMN-01 | Visual layout | Open /manage/brands, verify table renders with all columns |
| Image upload preview displays in form | ADMN-01 | Browser file API | Create listing, attach image, verify preview shows |
| Sidebar navigation shows manage sub-items | ADMN-01 | Visual layout | Login as admin, verify Manage section in sidebar |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
