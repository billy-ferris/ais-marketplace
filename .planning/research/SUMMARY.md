# Project Research Summary

**Project:** AIS Marketplace
**Domain:** B2B CPG Excess Inventory / Closeout Marketplace
**Researched:** 2026-03-08
**Confidence:** HIGH

## Executive Summary

AIS Marketplace is a brokered B2B marketplace connecting CPG manufacturers (beauty/personal care) with retail buyers for excess, closeout, discontinued, and short-dated inventory. The platform's structural differentiator is its intermediary model: AIS sits between manufacturer and retailer, adding a 10% margin to retailer offers before presenting them to manufacturers and stripping that margin from manufacturer counteroffers before showing them to retailers. This margin transformation is the revenue engine and the most critical piece of business logic in the system. The recommended build approach is a React + Express monorepo with a hybrid data architecture -- Contentful for editorial product content (brand pages, descriptions, imagery) and PostgreSQL for all transactional data (inventory, offers, orders, notifications). This hybrid pattern is well-documented but demands careful data consistency management from day one.

The competitive landscape includes Highstock (closest analog, beauty-focused, AI-heavy, $5.5M raised), Ghost ($95M funded, apparel-dominant), and commodity liquidation platforms (BULQ, B-Stock) that destroy brand value. AIS differentiates through CPG beauty/personal care vertical focus, human intermediation over algorithmic matching, and an editorial catalog approach that protects brand perception. The recommended stack -- React 19, Express 5, PostgreSQL 16, Drizzle ORM, Clerk auth, Contentful CMS, TanStack Query -- is deliberately boring and well-supported, avoiding cutting-edge choices in favor of ecosystem maturity and hiring familiarity. Phase 1 targets a demo-ready MVP with real architecture and sample data, not a throwaway prototype.

The primary risks are: (1) margin calculation bugs destroying financial trust -- mitigated by storing prices as integer cents with dual-price storage on every offer record; (2) inventory overselling from concurrent offers on the same stock -- mitigated by a soft reservation system with offer expiration; (3) Contentful/PostgreSQL data inconsistency from the hybrid architecture -- mitigated by using Contentful entry IDs as linking keys with reconciliation tooling; and (4) Contentful's free tier prohibition on commercial use -- mitigated by budgeting for the $300/month Lite plan before any external demo. All four risks must be addressed in Phase 1 foundations, not deferred.

## Key Findings

### Recommended Stack

The stack is a TypeScript monorepo with npm workspaces, split into `apps/web` (React + Vite frontend deployed to Vercel) and `apps/api` (Express backend deployed to Railway) with `packages/shared` for Zod schemas, TypeScript types, and constants. The shared package is the most important structural decision -- it keeps offer state enums, margin types, and API contracts in sync across frontend and backend without requiring tRPC or GraphQL. Drizzle ORM was chosen over Prisma for its zero-binary-dependency footprint (critical for Railway cold starts) and SQL-like API that maps directly to PostgreSQL operations.

**Core technologies:**
- **React 19 + Vite 6:** Standard frontend stack. Vite replaces the deprecated CRA. shadcn/ui (Radix + Tailwind v4) for component library -- copy-paste, not a package dependency.
- **Express 5 + Node.js 22 LTS:** Production-ready API framework. Express 5 adds native async error handling. REST over tRPC/GraphQL for simplicity with a potentially mixed-experience team.
- **PostgreSQL 16 + Drizzle ORM:** Owns all transactional data. Native full-text search (tsvector + GIN indexes) eliminates the need for Elasticsearch at MVP scale (<10k SKUs). Drizzle provides TypeScript type inference from schema definitions.
- **Contentful (Delivery API):** Owns editorial content (brand descriptions, product copy, images, category taxonomy). Server-side only -- the frontend never calls Contentful directly. Cached with 60-300s TTL on the API server.
- **Clerk (publicMetadata RBAC):** Authentication with three platform-level roles (Admin, Manufacturer, Retailer). User metadata approach, not Clerk Organizations -- the business model has fixed roles, not teams. Session JWT customization delivers role claims without network round-trips.
- **TanStack Query 5:** Server state management. All data fetching goes through query hooks. No Redux, no Zustand -- TanStack Query handles caching, background refetching, and optimistic updates for offer flows.
- **Resend + React Email:** Transactional email for offer notifications, order confirmations. React component-based templates. Free tier covers 3k emails/month.
- **Zod 4:** Shared validation schemas between frontend forms (via React Hook Form) and Express API routes. `z.infer<>` generates TypeScript types from schemas.

### Expected Features

**Must have (table stakes -- Phase 1 demo):**
- Product catalog with brand/category browsing (hybrid Contentful + PostgreSQL hydration)
- Full-text search with UPC lookup (PostgreSQL tsvector, non-negotiable for CPG buyers)
- Category and attribute filtering with sort options
- Detailed listing pages with all B2B decision fields (case pack, FOB, expiration, restrictions)
- Order Builder scoped per BrandListing (not a persistent cross-listing cart)
- Buy Now (fixed-price) and Best Offer (negotiation with margin transformation) purchase paths
- Three-role RBAC with Clerk (Admin, Manufacturer, Retailer)
- Manufacturer portal (view inventory, manage offers)
- Admin inventory management and offer visibility dashboard
- In-app + email notifications for all transaction events
- Order confirmation and tracking (logistics offline in Phase 1)
- Export as XLS and PDF
- Responsive web design (no native app)

**Should have (differentiators -- Phase 2):**
- Manufacturer self-serve inventory upload (currently admin-bottlenecked)
- Retail campaigns (RangeMe-style curated collections)
- Marketing bulletins and admin email blast tool
- Inventory alert / saved search notifications
- Enhanced programmatic restriction enforcement

**Defer (v2+):**
- Payment processing (Stripe/Dwolla -- PCI compliance premature for demo)
- OMS/ERP integration (Ordoro, NetSuite -- data model must stabilize first)
- Net terms / trade credit (requires underwriting capability)
- AI matching/recommendations (no transaction data to train on yet)
- Native mobile app (responsive web covers mobile needs)

**Anti-features (explicitly do NOT build):**
- Auction/bidding (conflicts with margin-controlled intermediary model)
- Persistent cross-listing cart (cross-seller complexity is unjustified at MVP)
- Real-time buyer-seller chat (direct communication bypasses AIS, undermines revenue model)

### Architecture Approach

The architecture is a three-layer monolith (routes, services, data access) with server-side data hydration as the central pattern. The Express API merges Contentful editorial content with PostgreSQL transactional data into unified responses -- the frontend makes one API call per page, never two. The offer system uses an explicit finite state machine with a transition map shared between frontend and backend via the `packages/shared` workspace. Inventory integrity is protected by PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) for atomic decrements on order placement and a soft reservation system for pending offers.

**Major components:**
1. **Catalog Service** -- Hydrates Contentful editorial data (brand, product, images) with PostgreSQL transactional data (quantity, price, status). This is the most complex integration and the critical path for the entire application.
2. **Offer Service** -- Manages the offer state machine and applies/strips the 10% AIS margin. Stores both retailer-facing and manufacturer-facing prices on every record. Enforces valid state transitions through a central function.
3. **Order Service** -- Converts accepted offers to orders and handles Buy Now. Uses database transactions with row locking for atomic inventory decrement. Prevents overselling.
4. **Notification Service** -- Creates in-app notifications (always) and triggers email via Resend (based on user preference). Asynchronous email dispatch so failures do not block business transactions.
5. **Export Service** -- Generates XLS (ExcelJS) and PDF (jsPDF + autotable) exports server-side.

### Critical Pitfalls

1. **Contentful free tier is not licensed for commercial use.** The free plan explicitly prohibits commercial use cases. Account suspension would take down the entire product catalog. Budget $300/month for the Lite plan before any external demo, or defer Contentful to Phase 2 and use PostgreSQL for all product data initially.

2. **Inventory overselling from concurrent offers.** Unlike Buy Now (simple atomic decrement), offers create a temporal gap where inventory is "spoken for" but not committed. Implement soft reservations: track `reserved_quantity` on inventory rows, calculate `effective_available = total - confirmed - reserved`, enforce offer expiration (48-72 hours) to release stale reservations.

3. **Margin calculation bugs.** Bidirectional 10% margin transformation across multi-SKU offers with multiple counter-rounds is a rounding error minefield. Store all prices as integer cents. Store BOTH retailer-facing and manufacturer-facing prices on every offer record -- never derive one from the other at display time. Round up (`Math.ceil`) to protect AIS margin.

4. **Hybrid data inconsistency.** Contentful product exists but PostgreSQL inventory does not (or vice versa). Use Contentful entry IDs as the linking key in PostgreSQL. Admin inventory creation must validate that the Contentful entry exists first. Build a reconciliation endpoint to flag mismatches.

5. **Offer state machine complexity explosion.** Without a formal FSM, edge cases (expired offers, concurrent Buy Now + pending offer on same stock, multi-round counters) produce ad-hoc if/else chains and impossible states. Define all states and valid transitions upfront in shared code. Use a PostgreSQL enum type for status. Single transition function -- never set status directly from route handlers.

## Implications for Roadmap

Based on research, the build order should follow architectural dependencies. The Catalog Service (Contentful + PostgreSQL hydration) is the critical path -- everything else depends on catalog data flowing correctly.

### Phase 1: Foundation and Data Layer
**Rationale:** All application features depend on the shared types package, database schema, auth middleware, and Contentful content model. These have zero dependencies on each other and can be built first. The demo cannot function without these foundations, and they must be production-grade from day one to avoid the "throwaway demo" pitfall.
**Delivers:** Monorepo structure, shared TypeScript types and Zod schemas, PostgreSQL schema with migrations (including inventory reservation fields), Express server skeleton with Clerk auth + RBAC middleware + error handling, Contentful content model (Brand, Product, Category), seed data scripts.
**Addresses features:** Three-role RBAC, user registration, PostgreSQL + Contentful data foundations.
**Avoids pitfalls:** Demo-that-cannot-become-real-product (real migrations, real auth, real schema from day one); Clerk RBAC mismatch (publicMetadata, not Organizations); Contentful commercial use (decision point: budget for Lite or defer Contentful).

### Phase 2: Catalog and Storefront
**Rationale:** The Catalog Service is the most complex integration (hybrid data hydration) and the dependency for all browsing, searching, and purchasing flows. It must be built and validated before any frontend work can produce real pages. The storefront UI (shop page, listing detail, Order Builder) directly consumes catalog data.
**Delivers:** Contentful client + cache + mappers, Catalog Service with parallel fetch and merge, catalog API routes (listings, brands, search, filters), frontend API client + TanStack Query hooks, shop page with listing grid + category/brand filters + search + sort, listing detail pages, Order Builder (per-BrandListing).
**Addresses features:** Product catalog browsing, full-text search with UPC, category/brand filtering, listing detail pages, brand editorial content, featured/hero sections, responsive design.
**Avoids pitfalls:** Client-side Contentful fetching (server-side only); N+1 queries (batch fetching); Contentful/PostgreSQL data inconsistency (linking convention established in Phase 1).

### Phase 3: Transaction Engine (Offers and Orders)
**Rationale:** The offer negotiation flow with margin transformation is the core business logic and AIS's primary differentiator. It depends on catalog data (Phase 2) and the data model (Phase 1). Orders depend on offers (accepted offer converts to order) and on inventory (atomic decrement). This phase can partially overlap with Phase 2 on the backend since the offer and order services do not depend on the storefront UI.
**Delivers:** Offer state machine with margin logic, offer API routes with role-based filtering, order service with atomic inventory decrement, Buy Now and Best Offer purchase flows, notification service + Resend email integration.
**Addresses features:** Buy Now flow, offer/negotiation with margin logic, order confirmation and tracking, in-app + email notifications, margin-transparent intermediary model.
**Avoids pitfalls:** Margin calculation bugs (integer cents, dual-price storage, exhaustive tests); inventory overselling (soft reservations, row locking, offer expiration); offer state machine complexity (formal FSM, enum type, single transition function).

### Phase 4: Role-Specific Portals and Polish
**Rationale:** The manufacturer portal and admin dashboard consume data from the offer and order systems (Phase 3). They are role-filtered views of existing data, not new business logic. Export functionality is low-complexity and rounds out the demo feature set.
**Delivers:** Manufacturer portal (offer inbox, accept/decline/counter UI, inventory status view), admin dashboard (offer visibility, user management, at-a-glance status overview), export service (XLS/PDF), notification center with preferences, final UI polish and responsive design verification.
**Addresses features:** Manufacturer portal, admin inventory management, admin offer dashboard, export (XLS/PDF), notification preferences.
**Avoids pitfalls:** B2B UX treating buyers like consumers (data-dense listing cards, professional dashboard design); notification overload (actionable context in every notification); "looks done but isn't" items (offer expiration, role enforcement testing, UPC search verification).

### Phase 5: Post-Demo Enhancement (Phase 2 Features)
**Rationale:** These features add value but are not required for the initial demo pitch. They depend on real users being onboarded and real usage patterns emerging. Manufacturer self-serve upload is the highest-value item here as it removes the admin bottleneck on listing velocity.
**Delivers:** Manufacturer self-serve inventory upload with validation, retail campaigns (Contentful-driven curated collections), marketing bulletins and email blast tool, inventory alerts / saved search notifications, enhanced restriction enforcement.
**Addresses features:** All Phase 2 features from FEATURES.md.

### Phase 6: Transaction Infrastructure (Phase 3 Features)
**Rationale:** Payment processing, ERP integration, and credit terms require stable data models, real transaction volume, and operational maturity that do not exist during demo/early stages. Deferring these avoids premature PCI compliance burden and integration work on unstable schemas.
**Delivers:** Stripe/Dwolla payment processing, shipment tracking integration, OMS/ERP connectors, net terms / trade credit.

### Phase Ordering Rationale

- **Foundation before features:** The shared types package, database schema, and auth middleware are dependencies for every subsequent phase. Getting these wrong means rewriting downstream code.
- **Catalog before transactions:** The offer and order systems reference catalog data (listing IDs, SKU IDs, product names). The Catalog Service's hybrid hydration pattern must be proven before building on top of it.
- **Transactions before portals:** The manufacturer portal and admin dashboard are views into the offer/order data. Building the UI before the business logic is backwards -- the data shapes and state transitions must be defined first.
- **Portals before enhancements:** Phase 1-4 delivers a complete demo-ready MVP. Phase 5-6 features depend on real user feedback and operational maturity.
- **Architecture research identifies the Catalog Service (Contentful + PostgreSQL hydration) as the single critical path item.** If this integration fails or performs poorly, the entire product concept is at risk. Validate it early in Phase 2.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Catalog and Storefront):** The Contentful content model design (Brand, BrandListing, Product, Category reference structure) and the server-side hydration caching strategy need detailed specification. The `include` depth parameter, pagination via `skip/limit`, and cache invalidation patterns are nuanced. Research the Contentful Delivery API's `sys.id[in]` batch query syntax.
- **Phase 3 (Transaction Engine):** The offer state machine has many edge cases (concurrent offers, inventory reserved across multiple pending offers, multi-round counter drift). The margin calculation strategy needs a formal specification document with worked examples. Research PostgreSQL advisory locks vs. row-level locks for offer submission concurrency.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Monorepo setup, Drizzle schema definition, Express middleware chain, and Clerk integration are all well-documented with official quickstarts and established patterns.
- **Phase 4 (Portals and Polish):** Admin dashboards and manufacturer portals are CRUD views on existing data. TanStack Table + shadcn/ui Data Table is a documented pattern with examples.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library versions verified via npm registry on 2026-03-08. Technology choices backed by official documentation, active maintenance, and ecosystem maturity. Express 5, Drizzle ORM, and Clerk all have production-grade docs. |
| Features | HIGH | Competitor analysis covers 8+ platforms (Highstock, Ghost, BULQ, B-Stock, Spoiler Alert, BoxFox, RangeMe, Excess2Sell). Feature expectations cross-referenced against multiple B2B marketplace sources. Anti-feature reasoning is well-grounded. |
| Architecture | HIGH | Patterns verified against official Contentful, Clerk, PostgreSQL, and TanStack documentation. Hybrid CMS + database architecture has production references (Contentful + Hasura example). State machine and atomic decrement patterns are textbook PostgreSQL. |
| Pitfalls | HIGH | Critical pitfalls verified against official docs (Contentful free tier terms, PostgreSQL locking, Clerk RBAC patterns). Margin calculation and overselling pitfalls are well-known in marketplace engineering. Contentful licensing pitfall is the most impactful and least obvious. |

**Overall confidence:** HIGH

### Gaps to Address

- **Contentful plan decision:** The free tier vs. Lite plan ($300/month) trade-off must be resolved before Phase 2 begins. Alternatively, evaluate whether PostgreSQL can own all product data for Phase 1, deferring Contentful until editorial workflows actually matter. This is a business decision, not a technical one.
- **Offer expiration mechanism:** Research identified the need for automatic offer expiration (48-72 hours) to release reserved inventory, but the implementation approach (PostgreSQL scheduled job via pg_cron, application-level cron via node-cron, or Railway cron job) was not specified. Decide during Phase 3 planning.
- **Contentful webhook sync:** The architecture assumes admin-managed content in Phase 1 (low sync risk), but Phase 2's manufacturer self-serve upload will need Contentful webhook integration for real-time content change propagation. Webhook error handling and retry logic need specification during Phase 5 planning.
- **Multi-SKU offer granularity:** Research flagged but did not resolve whether a manufacturer can accept some SKUs and decline others within a single offer, or if offers are all-or-nothing. This is a business rule that affects the state machine design and must be decided before Phase 3 implementation.
- **Deployment pipeline:** Vercel (frontend) and Railway (backend) deployment configurations, environment variable management, and CI/CD pipeline setup were not detailed in the research. Standard patterns exist but need specification during Phase 1.

## Sources

### Primary (HIGH confidence)
- [Clerk Express SDK](https://clerk.com/docs/reference/express/overview) -- auth middleware, RBAC patterns
- [Clerk Basic RBAC with Metadata](https://clerk.com/docs/guides/secure/basic-rbac) -- publicMetadata role pattern
- [Drizzle ORM PostgreSQL setup](https://orm.drizzle.team/docs/get-started/postgresql-new) -- schema, migrations, driver config
- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch-intro.html) -- tsvector, tsquery, GIN indexes
- [PostgreSQL Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html) -- SELECT FOR UPDATE patterns
- [Contentful Technical Limits](https://www.contentful.com/developers/docs/technical-limits/) -- rate limits, entry limits
- [Contentful Free Plan FAQ](https://www.contentful.com/help/contentful-community-faq/) -- commercial use restriction
- [TanStack Query docs](https://tanstack.com/query/latest) -- caching, mutations, query invalidation
- [TanStack Table docs](https://tanstack.com/table/latest) -- headless data table, v8 API
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) -- TanStack Table integration
- npm registry (all version numbers verified 2026-03-08)

### Secondary (MEDIUM confidence)
- [Highstock - BeautyMatter](https://beautymatter.com/articles/highstock-turns-overstock-into-opportunity) -- competitor features, AI capabilities
- [Highstock - Greylock](https://greylock.com/portfolio-news/introducing-highstock/) -- market positioning, "Bloomberg terminal for unsold inventory"
- [Ghost - PYMNTS](https://www.pymnts.com/news/retail/2024/ghost-raises-40-million-to-expand-b2b-marketplace-for-surplus-inventory/) -- competitor scale, features
- [Contentful + GraphQL + Postgres via Hasura](https://www.contentful.com/blog/combining-contentful-graphql-postgres-hasura/) -- hybrid data architecture reference
- [Drizzle vs Prisma comparison](https://betterstack.com/community/guides/scaling-nodejs/drizzle-vs-prisma/) -- ORM selection rationale
- [Spoiler Alert](https://www.spoileralert.com/) -- CPG excess inventory industry context

### Tertiary (LOW confidence)
- None -- all sources were at least MEDIUM confidence with multiple corroborating references

---
*Research completed: 2026-03-08*
*Ready for roadmap: yes*
