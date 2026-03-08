# Pitfalls Research

**Domain:** B2B CPG excess inventory marketplace with hybrid CMS/database architecture and negotiation workflows
**Researched:** 2026-03-08
**Confidence:** HIGH (multiple areas verified against official documentation)

## Critical Pitfalls

### Pitfall 1: Contentful Free Tier Is Not Licensed for Commercial Use

**What goes wrong:**
The Contentful free plan explicitly states it "may only be used to test and learn about Contentful's product" and "may not be used to support commercial use cases." If AIS launches even a demo-ready MVP on the free tier and begins pitching to manufacturers/retailers, Contentful reserves the right to suspend or terminate the account. This means the entire product catalog (brand descriptions, imagery, category taxonomy) could disappear without warning.

**Why it happens:**
Teams see "free tier" and assume it covers early-stage startups. Contentful changed their free plan terms, and the paid Lite plan starts at $300/month -- a real jump from $0 that gets deferred "until later."

**How to avoid:**
Budget for the Contentful Lite plan ($300/month) from the start, or at minimum before any external demo. For true pre-demo development, the free tier is fine. The moment the application is shown to potential customers or used with real brand data for commercial purposes, upgrade. Alternatively, evaluate whether the Contentful content (brand descriptions, images, categories) could live in PostgreSQL for Phase 1 and migrate to Contentful in Phase 2 when editorial workflows actually matter.

**Warning signs:**
- Using real brand names/logos in Contentful on the free tier
- Sharing the demo URL with external parties while on free tier
- Approaching 10,000 records (free tier max) or 25 content types (free tier max)

**Phase to address:**
Phase 1 (foundation). Decision must be made before any demo deployment: either budget for Lite or defer Contentful integration.

---

### Pitfall 2: Inventory Overselling from Concurrent Offers on the Same Stock

**What goes wrong:**
Retailer A and Retailer B both see 500 units available for a SKU. Both submit offers for 400 units. Manufacturer accepts both offers. Now 800 units are committed against 500 available. This is the classic overselling race condition, made worse because offers are not instantaneous purchases -- they sit in "pending" state for hours or days while the Manufacturer reviews them.

**Why it happens:**
Unlike Buy Now (which can use simple atomic decrement), the offer workflow creates a temporal gap where inventory is "spoken for" but not yet committed. Developers either forget to track in-flight offer quantities or implement it without proper locking, allowing the available quantity to go stale between the check and the commitment.

**How to avoid:**
Implement a "soft reservation" system in PostgreSQL:
1. When an offer is submitted, calculate `effective_available = total_quantity - confirmed_orders - pending_offer_quantities`.
2. Use `SELECT ... FOR UPDATE` on the inventory row when creating offers to prevent concurrent reads of stale availability.
3. Store `reserved_quantity` on the inventory row (sum of all pending offer quantities for that SKU).
4. Reject or warn on offers where requested quantity exceeds effective available.
5. Release reservations when offers are declined or expire.
6. Add an `offer_expiration` (e.g., 48-72 hours) so stale offers auto-release reserved inventory.

Keep transactions short -- lock the row, update reserved quantity, commit. Do not hold locks while waiting for external input.

**Warning signs:**
- No `reserved_quantity` column or equivalent in the inventory schema
- Offer creation does not check current pending offers for the same SKU
- No expiration mechanism for pending offers
- `available_quantity` is only decremented on order confirmation, not on offer submission

**Phase to address:**
Phase 1 (data model design). The inventory schema must include reservation tracking from the start. Retrofitting this onto existing offer logic is a rewrite.

---

### Pitfall 3: Margin Calculation Bugs Causing Financial Discrepancy

**What goes wrong:**
AIS adds a 10% margin to retailer offers before showing them to manufacturers, and strips the margin from manufacturer counteroffers before showing them to retailers. This bidirectional margin transformation is a breeding ground for rounding errors, especially with multi-SKU offers where each line item has a different unit price. Over multiple rounds of countering, the margin can drift, compound incorrectly, or expose the raw price to the wrong party.

**Why it happens:**
Developers implement margin as a simple multiply/divide without considering:
- Floating-point rounding: `10.00 * 1.10 = 11.00`, but `10.33 * 1.10 = 11.363` -- do you round to $11.36 or $11.37? And does stripping 10% from $11.36 give you back $10.33 or $10.327272...?
- Per-item vs. per-order margin: applying 10% to each line item vs. 10% to the order total yields different numbers.
- Multi-round drift: after 3 rounds of offer/counter with rounding at each step, the effective margin may no longer be exactly 10%.

**How to avoid:**
1. Store all prices in cents (integers) to avoid floating-point issues entirely.
2. Define margin as a per-line-item calculation, always applied to the unit price: `manufacturer_price = Math.ceil(retailer_price * 1.10)` (round up to protect AIS margin).
3. Store BOTH the retailer-facing price AND the manufacturer-facing price on every offer/counteroffer record. Never derive one from the other at display time -- calculate once at creation, store both.
4. Add an invariant check: `manufacturer_price >= retailer_price * 1.10` on every offer mutation.
5. Write exhaustive unit tests covering edge cases: $0.01 items, $9999.99 items, quantities of 1 vs. 100,000, multi-SKU offers with mixed prices.

**Warning signs:**
- Prices stored as floats or decimals with insufficient precision
- Only one price stored per offer (the other derived via calculation at render time)
- No rounding strategy documented or tested
- Margin percentage hardcoded in multiple places rather than a single config

**Phase to address:**
Phase 1 (offer system implementation). This is load-bearing financial logic. Must be correct before any demo, and must have test coverage from day one.

---

### Pitfall 4: Hybrid Data Consistency -- Contentful Product Exists But PostgreSQL Inventory Does Not (or Vice Versa)

**What goes wrong:**
A product page renders with brand description and images from Contentful but shows "no inventory available" because the PostgreSQL inventory records reference a different ID or were never created. Conversely, an admin creates inventory in PostgreSQL for a product that was deleted or unpublished in Contentful, resulting in orphaned inventory that appears in searches but leads to broken detail pages.

**Why it happens:**
Two separate data stores with no transactional guarantee between them. Contentful entries have their own ID system (`sys.id`). PostgreSQL records have their own primary keys. The link between them (e.g., `contentful_entry_id` column in PostgreSQL) is maintained manually. There is no foreign key constraint across systems, no distributed transaction, and webhook-based sync is eventually consistent at best.

**How to avoid:**
1. Define a clear "source of truth" mapping: Contentful owns product identity (brand, name, description, images), PostgreSQL owns transactional state (inventory, prices, offers). A product "exists" only when it has BOTH a Contentful entry AND a PostgreSQL record.
2. Use Contentful entry IDs as the linking key stored in PostgreSQL. Never generate your own IDs for Contentful entities.
3. Build an admin "inventory creation" flow that requires selecting an existing Contentful entry before creating PostgreSQL records -- do not allow orphaned inventory.
4. Add a health check / reconciliation endpoint that compares Contentful entries against PostgreSQL records and flags mismatches.
5. For the MVP, where Admin manually enters everything, the risk is lower because one person controls both systems. But document the linking convention rigorously.

**Warning signs:**
- Frontend makes two independent API calls (Contentful + PostgreSQL) and does not handle the case where one succeeds and the other returns empty
- No validation that a Contentful entry ID exists before creating inventory in PostgreSQL
- No reconciliation tooling or scripts
- Contentful webhooks are the only sync mechanism with no error handling or retry logic

**Phase to address:**
Phase 1 (data model and admin tooling). The linking convention and validation must be established when the first content type and database table are created.

---

### Pitfall 5: Offer State Machine Complexity Explosion

**What goes wrong:**
The offer negotiation flow appears simple (submitted -> accepted/declined/countered) but edge cases multiply: What if a manufacturer counters and the retailer does not respond for two weeks? What if the manufacturer accepts but the inventory was sold via Buy Now in the meantime? What if the retailer submits two offers for the same SKU simultaneously? What if the admin needs to cancel an offer due to a product recall? Without a formal state machine, these edge cases are handled with ad-hoc if/else chains that become unmaintainable and produce impossible states.

**Why it happens:**
The "happy path" is straightforward and gets implemented quickly. Each edge case is patched individually with conditional logic. No one models the complete state diagram upfront. The offer table ends up with a `status` varchar column that accepts any string, and business logic is scattered across multiple route handlers.

**How to avoid:**
1. Model the offer lifecycle as an explicit finite state machine with defined states and valid transitions:
   - States: `draft`, `submitted`, `pending_manufacturer`, `countered_by_manufacturer`, `pending_retailer`, `accepted`, `declined`, `expired`, `cancelled`
   - Valid transitions: `submitted -> pending_manufacturer`, `pending_manufacturer -> accepted | declined | countered_by_manufacturer`, `countered_by_manufacturer -> pending_retailer`, `pending_retailer -> accepted | declined | countered_by_retailer`, etc.
2. Use a PostgreSQL enum type for status (not varchar) to prevent impossible values.
3. Enforce transitions in a single function -- never set status directly from route handlers.
4. Add `expires_at` to every offer and a background job (or cron) to transition expired offers to `expired` state and release reserved inventory.
5. Include `previous_status` and `transitioned_at` for audit trail.

**Warning signs:**
- Offer status stored as free-text string
- Status updates happen in multiple places (route handlers, services, background jobs) without a central transition function
- No expiration mechanism for stale offers
- No test covering the full offer lifecycle from submission through multiple counter rounds to acceptance

**Phase to address:**
Phase 1 (offer system design). The state machine must be designed before the first line of offer logic is written. It is the skeleton that everything else hangs on.

---

### Pitfall 6: Clerk RBAC Architecture Mismatch -- Organizations vs. User Metadata

**What goes wrong:**
The project has three roles (Admin, Manufacturer, Retailer) with fundamentally different UI surfaces. Developers pick the wrong Clerk RBAC pattern -- either using Organizations (designed for multi-tenant B2B where users belong to teams) when simple user-level roles suffice, or using user metadata (designed for B2C) when the business later needs manufacturers to invite team members. The wrong choice leads to either over-engineering the auth layer or a painful migration later.

**Why it happens:**
Clerk offers two RBAC approaches and the documentation is biased toward Organizations for "B2B" apps. But AIS is not a multi-tenant SaaS -- it is a brokered marketplace where each manufacturer and retailer is a single entity (in Phase 1), not a team with internal roles. Organizations adds complexity (org creation flows, org switching, org-scoped permissions) that is not needed yet.

**How to avoid:**
For Phase 1, use Clerk's user metadata approach (`publicMetadata.role = "admin" | "manufacturer" | "retailer"`). This is simpler, sufficient for single-user-per-company in MVP, and avoids the overhead of organization management UI. Design the middleware to read role from `publicMetadata` and gate routes accordingly.

Plan the migration path: if Phase 2 adds manufacturer team members (e.g., a sales rep and a fulfillment person for the same manufacturer), migrate to Clerk Organizations at that point. The key is to make the role check in your middleware abstract enough that swapping the underlying mechanism (metadata vs. org role) does not require rewriting every protected route.

**Warning signs:**
- Implementing Clerk Organizations for three users in Phase 1
- Building org invitation flows, org switcher UI, or org-scoped API tokens before any manufacturer has more than one user
- Role checks tightly coupled to Clerk's Organizations API in route handlers rather than abstracted behind a middleware layer

**Phase to address:**
Phase 1 (auth setup). Choose metadata-based RBAC now; document the Organizations migration trigger for Phase 2+.

---

### Pitfall 7: Demo MVP That Cannot Become a Real Product

**What goes wrong:**
The Phase 1 MVP is built as a "demo" with shortcuts that make it impossible to evolve into production: hardcoded sample data, no real auth flows, mock API responses, frontend-only state management, no database migrations. When the demo succeeds and the business wants to onboard real manufacturers, the "demo" must be thrown away and rebuilt from scratch.

**Why it happens:**
"It is just a demo" thinking leads to skipping foundational work (database migrations, proper API architecture, environment configuration, error handling). The demo looks impressive in a pitch meeting but is a Potemkin village.

**How to avoid:**
Build the demo as a real application with sample data, not a fake application with hardcoded responses. Specifically:
1. Real database schema with migrations (even if seeded with sample data)
2. Real API endpoints (even if the sample data is curated)
3. Real auth flow with Clerk (even if the demo accounts are pre-created)
4. Real offer workflow (even if the demo script walks through a specific scenario)
5. Environment-based configuration (dev/staging/production) from day one
6. The ONLY acceptable shortcuts for Phase 1: no payment processing, no real shipping logistics, no email verification of manufacturers

**Warning signs:**
- `if (process.env.DEMO_MODE)` conditionals scattered through the codebase
- API endpoints returning hardcoded JSON instead of querying the database
- No database migration files (schema created manually)
- Frontend state that does not round-trip through the API

**Phase to address:**
Phase 1 (project setup and every subsequent milestone). The architecture must be production-grade from the start; only the data and operational processes are demo-grade.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing prices as floats instead of integer cents | Simpler initial code | Rounding errors in margin calculations compound across offers | Never -- use integer cents from day one |
| Single Contentful space for all environments | Free tier limit of 1 space | Dev changes to content model affect production data; no safe testing | MVP only -- budget for Lite plan ($300/mo) with multiple environments before real users |
| No offer expiration mechanism | Simpler offer logic | Stale offers lock up inventory indefinitely; manufacturers see ancient offers | Never -- even a simple 72-hour TTL prevents inventory deadlock |
| Skipping Contentful webhook error handling | Faster initial integration | Silent sync failures lead to orphaned data; broken product pages in production | MVP only if admin manually manages both systems; fix before self-serve |
| Frontend-only role checks (no backend enforcement) | Faster UI development | Any API client can bypass role restrictions; a curl command can access manufacturer data as a retailer | Never -- backend middleware must enforce roles from the first protected route |
| No database indexes on offer/inventory lookup columns | Simpler initial migration | Queries degrade as offer volume grows; 1000+ offers makes dashboard unusable | Only in earliest dev; add indexes before demo with realistic data volume |
| Embedding Contentful API keys in frontend bundle | Quick setup | Keys are extractable from browser; anyone can read all Contentful content directly | Acceptable for CDA (read-only, public content) but NEVER for CMA (write access) |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Contentful CDA | Calling the API on every page load without caching, hitting the 55 req/sec rate limit during demos with multiple users | Cache Contentful responses in-memory or Redis with 5-minute TTL. Product catalog data changes infrequently -- treat it as near-static. Invalidate cache on Contentful webhook publish events. |
| Contentful CMA | Using the Management API from the frontend to create/edit content | CMA calls only from the backend. CMA rate limit is 7 req/sec on free tier. Admin operations should queue writes if bulk-editing. |
| Clerk Auth | Using `requireAuth()` on API routes, which redirects to homepage on 401 instead of returning a JSON error | Use `clerkMiddleware()` + `getAuth()` for API routes. Return proper HTTP 401/403 JSON responses. Reserve `requireAuth()` for server-rendered page routes only. |
| Clerk Session | Assuming the Clerk session JWT contains role information without explicitly adding it to metadata | Role must be stored in `publicMetadata` and included in the session token via Clerk Dashboard session token customization. Verify the JWT claim exists before relying on it in middleware. |
| Resend Email | Sending emails synchronously in the offer acceptance flow, blocking the API response | Queue email sends asynchronously. Offer acceptance should commit to the database first, then fire-and-forget the email. Failed emails should not roll back business transactions. |
| Railway PostgreSQL | Assuming persistent connections without configuring connection pooling | Railway databases may restart. Use a connection pool (e.g., `pg` pool or Prisma connection pooling). Set `connection_limit` appropriately for Railway's resource tier. Handle `ECONNRESET` gracefully. |
| Vercel Serverless (if applicable) | Cold starts causing Clerk middleware initialization delays on first request | If using Vercel serverless functions for API: keep functions warm, or use Railway for the Express API (as planned) to avoid cold start issues entirely. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| N+1 queries on product listing pages (one Contentful call per product + one PostgreSQL query per product for inventory) | Shop page takes 3-5 seconds to load with 50+ products | Batch Contentful queries using `sys.id[in]` filter. Batch PostgreSQL queries with `WHERE contentful_id IN (...)`. Hydrate in application layer. | 50+ products on a single page |
| No pagination on inventory/offer dashboards | Admin dashboard loads all offers/inventory into memory | Implement cursor-based or offset pagination from the start. Default page size of 25. | 200+ offers or 100+ inventory records |
| Contentful `include` depth fetching entire reference trees | Single API call returns 5MB of nested data including all linked entries | Set `include` parameter explicitly (1 or 2 max). Fetch only the fields needed with `select` parameter. | Content model with 3+ levels of references |
| Full-text search hitting PostgreSQL without indexes | Search response time grows linearly with product count | Use PostgreSQL `tsvector`/`tsquery` with GIN indexes for full-text search. Consider `pg_trgm` for fuzzy/partial matching on UPC codes. | 500+ products |
| Offer history stored as flat records without archival | Offer table grows indefinitely with every counter-round | Partition or archive completed offers (accepted/declined/expired) after 90 days. Keep a summary record; move details to an archive table. | 5,000+ total offer records |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing manufacturer pricing to retailers (or vice versa) through API responses | The entire business model depends on price opacity. If a retailer sees the manufacturer's raw price, AIS loses its value proposition. | API response serialization must be role-aware. Create separate DTOs for retailer-facing and manufacturer-facing offer views. Never include both prices in the same API response. Test with a raw API client (not just the UI). |
| Contentful CMA key exposed in frontend or public repo | Full write access to all content -- attacker can modify product descriptions, images, or delete entries | CMA keys only in backend environment variables. Frontend uses CDA (read-only) key only. Add CMA key to `.gitignore` and secrets manager. |
| Clerk `publicMetadata` writable from the frontend | Users could self-promote to Admin role by modifying their own metadata | `publicMetadata` is only writable from the backend (Clerk Backend API). Verify this is enforced. Do NOT use `unsafeMetadata` for role storage (it IS client-writable). |
| No rate limiting on offer submission endpoint | A retailer could flood a manufacturer with hundreds of offers, or a script could reserve all inventory via soft reservations | Rate limit offer creation: max 5 active offers per retailer per SKU. Rate limit API endpoints generally (Express rate-limit middleware). |
| Offer/order IDs using sequential integers exposed in URLs | Competitors or curious users can enumerate all offers/orders by incrementing the ID | Use UUIDs or CUIDs for offer and order identifiers in URLs and API responses. Sequential integers are fine as internal primary keys. |

## UX Pitfalls

Common user experience mistakes in B2B marketplace applications.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Treating B2B like B2C: flashy product cards, minimal information density, "Add to Cart" button | Professional buyers need data density -- case pack size, pallet quantity, FOB location, minimum order, expiration date. A pretty card with just an image and price wastes their time. | Design listing cards and detail pages with data tables, not consumer product cards. Show all decision-critical fields (unit price, case pack, available qty, best-by date, FOB, restrictions) without requiring a click-through. |
| No bulk/multi-SKU ordering interface | Retailers purchasing across multiple SKUs from the same brand must submit separate offers for each, creating friction and fragmenting negotiations | The Order Builder (per-BrandListing) partially addresses this but must support selecting multiple SKUs with individual quantities in a single offer. Matrix-style input (SKU rows x quantity columns) is the B2B standard. |
| Search that only matches product names | Buyers search by UPC, brand name, category, or even case pack size. Name-only search misses most B2B search patterns. | Full-text search across product name, brand, UPC, description, and category. Support exact UPC lookup (12-digit code). Filter by category, brand, FOB location, and discount percentage. |
| Notification overload without actionable context | "You have a new offer" tells the manufacturer nothing. They must click through, find the offer, review details. Repeat 20 times a day. | Notifications must include: product name, retailer name (or anonymized), quantity, proposed price, and a direct link to the offer detail page. One click from notification to action. |
| No clear visual distinction between Buy Now and Make Offer flows | Users confused about which action they are taking, leading to accidental purchases or abandoned offer flows | Visually separate the two flows: different button colors, confirmation modals with explicit language ("You are purchasing X units at $Y" vs. "You are proposing X units at $Y -- the manufacturer will review your offer"). |
| Admin dashboard without at-a-glance status overview | Admin (AIS) opens the dashboard and sees a flat list of everything. No prioritization, no urgency signals. | Dashboard should surface: offers pending >24 hours, low-stock items with active offers, recently expired offers, and today's accepted orders. Use status badges and sort by urgency. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Offer workflow:** Often missing expiration handling -- verify that offers automatically expire after a configured period and reserved inventory is released
- [ ] **Margin calculation:** Often missing edge case for $0 offers or 1-cent items -- verify that margin math works at extreme low and high values without producing $0 AIS revenue
- [ ] **Role-based API routes:** Often missing backend enforcement -- verify that hitting manufacturer endpoints with a retailer token returns 403, not just hiding the UI link
- [ ] **Product detail page:** Often missing the "no inventory" state -- verify that a Contentful product with zero PostgreSQL inventory shows an appropriate empty state, not a broken page
- [ ] **Search functionality:** Often missing UPC search -- verify that pasting a 12-digit UPC code returns the exact product match
- [ ] **Notifications:** Often missing the "mark as read" and "notification preferences" -- verify that the notification count actually decrements and that email toggles persist
- [ ] **Export (XLS/PDF):** Often missing proper formatting -- verify that exported files open correctly in Excel and that PDFs render on all major browsers, not just Chrome
- [ ] **Offer counter-round tracking:** Often missing a round limit -- verify that the system handles 10+ counter-rounds without UI degradation or state corruption
- [ ] **Contentful image handling:** Often missing responsive images and fallbacks -- verify that missing images show a branded placeholder, not a broken image icon
- [ ] **Multi-SKU offers:** Often missing per-line-item status -- verify that a manufacturer can accept some SKUs and decline others within a single offer (if the business requires this), or that the system clearly enforces all-or-nothing

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Oversold inventory (offers accepted beyond available qty) | MEDIUM | Add a `fulfillment_status` check before converting accepted offers to orders. Notify the second retailer that their accepted offer cannot be fulfilled. Implement reservation system retroactively. Business impact: damaged trust with one retailer. |
| Margin calculation drift after multiple counter-rounds | LOW | Recalculate all active offers with the correct margin formula. Store both prices going forward. Issue correction notices if any offers were displayed incorrectly. |
| Contentful/PostgreSQL data out of sync | MEDIUM | Build a reconciliation script that lists all Contentful entries without PostgreSQL inventory and all PostgreSQL records without Contentful entries. Admin manually resolves each mismatch. Run weekly until webhook sync is reliable. |
| Contentful free tier account suspended | HIGH | All product content (descriptions, images, categories) becomes inaccessible. Recovery: upgrade to Lite plan immediately ($300/mo), contact Contentful support for account reinstatement. Prevention is far cheaper than recovery. |
| State machine corruption (offer in impossible state) | MEDIUM | Add a database migration that checks all active offers against valid state transitions and flags invalid ones. Admin manually resolves flagged offers. Add state transition logging to prevent recurrence. |
| Clerk role escalation (user with wrong role) | LOW-MEDIUM | Audit all `publicMetadata.role` values via Clerk Backend API. Correct any misassigned roles. Review access logs for any actions taken with incorrect permissions. Add role-change audit logging. |
| Demo MVP cannot evolve to production | HIGH | This is the most expensive pitfall. If the demo was built with hardcoded data and no real architecture, the recovery is a full rewrite. There is no shortcut. Prevention (building real architecture from day one) is the only viable strategy. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Contentful free tier commercial restriction | Phase 1 (project setup) | Confirm Contentful plan is Lite or higher before any external demo |
| Inventory overselling from concurrent offers | Phase 1 (data model + offer system) | Write integration test: two concurrent offer submissions for the same SKU, total exceeding available qty -- second should fail or warn |
| Margin calculation bugs | Phase 1 (offer system) | Unit tests covering: penny rounding, multi-SKU offers, 3+ counter-rounds, $0.01 items, $9999.99 items. Verify both stored prices on every offer record. |
| Contentful/PostgreSQL data inconsistency | Phase 1 (data model + admin tooling) | Reconciliation endpoint returns zero mismatches after seeding sample data. Admin create-inventory flow validates Contentful entry exists first. |
| Offer state machine complexity | Phase 1 (offer system design) | State diagram documented. Enum type in database. Single transition function. Test: full lifecycle from submission through 3 counter-rounds to acceptance. |
| Clerk RBAC architecture mismatch | Phase 1 (auth setup) | Role stored in `publicMetadata`. Middleware reads role from JWT claims. No Clerk Organizations code in Phase 1. Migration path documented. |
| Demo MVP that cannot become real product | Phase 1 (all milestones) | Database has migration files. API endpoints query real database. Auth uses real Clerk flow. No `DEMO_MODE` conditionals. Sample data loaded via seed script, not hardcoded. |
| B2B UX treating buyers like consumers | Phase 1 (UI implementation) | Product listing shows all critical fields (price, qty, case pack, expiration, FOB) without requiring click-through. Validated with highstock.com reference. |
| Search without UPC/multi-field support | Phase 1 (search implementation) | Search by UPC returns exact match. Search by brand name returns all brand products. GIN index on tsvector column confirmed in migration. |
| Notification overload without context | Phase 1 (notification system) | Every notification includes product name, counterparty, amount, and direct action link. Verified in notification template. |

## Sources

- [Contentful Technical Limits](https://www.contentful.com/developers/docs/technical-limits/) -- rate limits, entry limits, field limits (HIGH confidence, official docs)
- [Contentful Free Plan FAQ](https://www.contentful.com/help/contentful-community-faq/) -- commercial use restriction: free tier is for testing only, not commercial use (HIGH confidence, official docs)
- [Contentful Usage Limits](https://www.contentful.com/help/admin/usage/usage-limit/) -- enforcement policy: suspension or termination for violations (HIGH confidence, official docs)
- [Contentful Content Modeling Patterns](https://www.contentful.com/help/content-models/content-modeling-patterns/) -- reference depth, content type design guidance (HIGH confidence, official docs)
- [Clerk Express SDK](https://clerk.com/docs/reference/express/overview) -- clerkMiddleware, requireAuth, getAuth (HIGH confidence, official docs)
- [Clerk Basic RBAC with Metadata](https://clerk.com/docs/guides/secure/basic-rbac) -- user metadata approach for non-Organizations RBAC (HIGH confidence, official docs)
- [Clerk Organizations RBAC](https://clerk.com/blog/role-based-access-control-with-clerk-orgs) -- when to use Organizations vs. metadata (HIGH confidence, official blog)
- [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html) -- SELECT FOR UPDATE, NOWAIT, SKIP LOCKED (HIGH confidence, official docs)
- [PostgreSQL Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html) -- MVCC, optimistic locking patterns (HIGH confidence, official docs)
- [Spoiler Alert: CPG Excess Inventory](https://www.spoileralert.com/) -- industry context: 47% of excess inventory sold, 71% average discount (MEDIUM confidence, industry vendor)
- [RangeMe: Managing Surplus Inventory](https://www.rangeme.com/blog/managing-surplus-and-short-dated-inventory-why-it-matters-to-cpg-brands/) -- short-dated inventory challenges in CPG (MEDIUM confidence, industry blog)
- [Dev.to: Race Conditions in Omnichannel Retail](https://dev.to/millietechinsights/conquering-race-conditions-in-omnichannel-retail-a-developers-guide-to-inventory-sync-3ehc) -- inventory sync race condition patterns (MEDIUM confidence, community)
- [Sylius: State Machines in Ecommerce](https://sylius.com/blog/what-is-state-machine-and-why-is-it-useful-in-modeling-ecommerce-processes/) -- FSM patterns for order/offer workflows (MEDIUM confidence, vendor blog)
- [Pilotsprint: MVP Scope Creep Prevention](https://www.pilotsprint.com/blogs/the-hidden-cost-of-mvp-scope-creep-why-less-really-is-more) -- B2B MVP scoping best practices (MEDIUM confidence, industry blog)
- [BigCommerce: B2B Ordering Tools](https://www.bigcommerce.com/articles/b2b-ecommerce/b2b-order-management/) -- professional buyer UX expectations (MEDIUM confidence, vendor docs)
- [Zigpoll: B2B Bulk Ordering UX](https://www.zigpoll.com/content/how-can-a-ux-designer-improve-our-online-platform-to-streamline-bulk-ordering-processes-and-enhance-the-overall-experience-for-retail-buyers) -- bulk ordering patterns and matrix view (MEDIUM confidence, industry article)

---
*Pitfalls research for: B2B CPG excess inventory marketplace (AIS Marketplace)*
*Researched: 2026-03-08*
