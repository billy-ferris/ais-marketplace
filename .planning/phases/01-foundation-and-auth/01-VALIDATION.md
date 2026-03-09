---
phase: 1
slug: foundation-and-auth
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | apps/api/vitest.config.ts |
| **Quick run command** | `pnpm --filter @ais/api test` |
| **Full suite command** | `pnpm turbo test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @ais/api test`
- **After every plan wave:** Run `pnpm turbo test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | AUTH-01 | manual | N/A (Clerk service) | N/A | ⬜ manual-only |
| 1-02-01 | 02 | 1 | AUTH-06 | unit | `pnpm --filter @ais/api test` | schema.test.ts | ✅ green |
| 1-02-02 | 02 | 1 | AUTH-07 | unit | `pnpm --filter @ais/api test` | schema.test.ts | ✅ green |
| 1-03-01 | 03 | 2 | AUTH-04 | unit | `pnpm --filter @ais/api test` | rbac.test.ts | ✅ green |
| 1-03-02 | 03 | 2 | AUTH-05 | unit | `pnpm --filter @ais/api test` | rbac.test.ts | ✅ green |
| 1-04-01 | 04 | 2 | AUTH-06 | unit | `pnpm --filter @ais/api test` | schema.test.ts | ✅ green |
| 1-04-02 | 04 | 2 | AUTH-07 | unit | `pnpm --filter @ais/api test` | schema.test.ts | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `apps/api/vitest.config.ts` -- vitest configuration
- [x] `apps/api/src/__tests__/` -- test directory structure
- [x] `vitest` -- installed as dev dependency in apps/api

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| User account creation via Clerk | AUTH-01 | Clerk service dependency, webhook sync requires live Clerk | Run seed script, verify users exist in both Clerk and local DB |
| Clerk email verification sent on signup | AUTH-02 | Requires Clerk service interaction | Create account, check email inbox for verification |
| Session persists across browser refresh | AUTH-03 | Browser behavior, requires real browser | Login, refresh page, verify still authenticated |
| Role-based UI routing | AUTH-05 | Visual verification of correct dashboard | Login as each role, verify correct dashboard renders |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s (1.28s actual)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated (2026-03-09)
