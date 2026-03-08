---
phase: 1
slug: foundation-and-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-08
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | none — Wave 0 installs |
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
| 1-01-01 | 01 | 1 | AUTH-01 | integration | `pnpm --filter @ais/api test` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | AUTH-06 | unit | `pnpm --filter @ais/api test` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | AUTH-07 | unit | `pnpm --filter @ais/api test` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | AUTH-04 | unit | `pnpm --filter @ais/api test` | ❌ W0 | ⬜ pending |
| 1-03-02 | 03 | 2 | AUTH-05 | integration | `pnpm --filter @ais/api test` | ❌ W0 | ⬜ pending |
| 1-04-01 | 04 | 2 | AUTH-06 | unit | `pnpm --filter @ais/api test` | ❌ W0 | ⬜ pending |
| 1-04-02 | 04 | 2 | AUTH-07 | unit | `pnpm --filter @ais/api test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/vitest.config.ts` — vitest configuration
- [ ] `apps/api/src/__tests__/` — test directory structure
- [ ] `vitest` — install as dev dependency if no framework detected

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Clerk email verification sent on signup | AUTH-02 | Requires Clerk service interaction | Create account, check email inbox for verification |
| Session persists across browser refresh | AUTH-03 | Browser behavior, requires real browser | Login, refresh page, verify still authenticated |
| Role-based UI routing | AUTH-05 | Visual verification of correct dashboard | Login as each role, verify correct dashboard renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
