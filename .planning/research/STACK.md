# Stack Research

**Domain:** B2B CPG Excess Inventory Marketplace
**Researched:** 2026-03-08
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.x | Frontend UI framework | Standard for complex interactive UIs. React 19 brings improved Suspense, use() hook, and Actions for form handling. Massive ecosystem for marketplace patterns. |
| TypeScript | 5.x | Type safety across frontend and backend | Non-negotiable for a multi-role B2B app with complex offer/negotiation flows. Catches contract mismatches between API and frontend at compile time. |
| Vite | 6.x | Frontend build tool | Fastest DX for React development. Sub-second HMR, native ESM, built-in proxy for API during dev. CRA is dead; Vite is the standard. |
| Node.js | 22 LTS | Backend runtime | Long-term support through April 2027. Native fetch, improved performance, stable ESM support. |
| Express | 5.x | REST API framework | Express 5 is production-ready (released late 2024). Path matching improvements, async error handling, removed deprecated APIs. Use 5.x for new projects; no reason to start on 4.x. |
| PostgreSQL | 16+ | Transactional database | Owns all transactional data: users, inventory SKUs, orders, offers, counteroffers, notifications. Native full-text search (tsvector) eliminates need for Elasticsearch at this scale. JSONB for flexible metadata. |
| Contentful | CDA v1 | Headless CMS for editorial content | Owns brand descriptions, marketing copy, imagery, category taxonomy. Free tier covers MVP (25k records, 2 locales). REST API with CDN-backed delivery. |
| Clerk | Latest | Authentication + RBAC | Native React and Express SDKs. publicMetadata-based RBAC for Admin/Manufacturer/Retailer roles (simpler than Organizations for this use case -- see Auth section). Free tier covers MVP (10k MAUs). |
| Resend | Latest | Transactional email | Clean Node.js SDK, React Email integration for component-based templates. Free tier: 3k emails/month. Webhooks for delivery tracking. |
| Tailwind CSS | 4.x | Utility-first styling | Tailwind v4 uses CSS-first configuration (no tailwind.config.js), Oxide engine for faster builds. Standard pairing with shadcn/ui. |
| shadcn/ui | Latest | UI component library | Not a package -- copy-paste components built on Radix UI primitives. Full control over styling. Data Table component wraps TanStack Table. Forms integrate React Hook Form + Zod. |

### Database & ORM

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Drizzle ORM | 0.45.x | Type-safe PostgreSQL query builder | SQL-like API maps directly to PostgreSQL operations. ~7kb bundle, zero binary deps (critical for Railway cold starts). Schema defined in TypeScript -- no separate schema language. Faster than Prisma in benchmarks, especially for complex joins needed in offer/order queries. |
| drizzle-kit | 0.31.x | Schema migrations | `drizzle-kit generate` creates SQL migration files. `drizzle-kit push` for rapid dev. `drizzle-kit studio` for visual DB browser. Migration files are plain SQL -- inspectable and version-controllable. |
| pg (node-postgres) | 8.x | PostgreSQL driver | Battle-tested driver used under Drizzle. Connection pooling via `Pool`. Drizzle auto-detects and configures when you pass a connection string. |

### Frontend Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-table | 8.x | Headless data table engine | Every table in the app: inventory listings, order history, offer management, admin dashboards. Handles sorting, filtering, pagination, column visibility, row selection. shadcn/ui Data Table wraps this. |
| @tanstack/react-query | 5.x | Server state management | All API data fetching. Smart caching, background refetching, optimistic updates for offer accept/decline. Stale-while-revalidate for inventory listings. Query invalidation on mutations. |
| @tanstack/react-query-devtools | 5.x | Query debugging | Dev-only. Inspect cache state, trigger refetches, test stale/error states. Remove from production builds. |
| react-hook-form | 7.x | Form state management | Order Builder forms, offer submission, listing creation. Minimal re-renders, native validation. Paired with Zod via @hookform/resolvers. |
| zod | 4.x | Schema validation | Shared validation schemas between frontend forms and Express API routes. Define once, validate everywhere. z.infer<> generates TypeScript types from schemas. |
| @hookform/resolvers | 5.x | Form-to-schema bridge | Connects Zod schemas to React Hook Form. One-liner: `resolver: zodResolver(schema)`. |
| nuqs | 2.x | URL state management | Search filters, sort order, pagination, category/brand filters on shop page. Type-safe URL params that survive page refresh and enable shareable filtered views. 6kb gzipped. |
| sonner | 2.x | Toast notifications | In-app notification toasts for order confirmations, offer updates, system messages. Accessible, animated, stackable. Better API than react-hot-toast. |
| lucide-react | 0.x | Icon library | Consistent icon set across all UI. Tree-shakable (only imported icons ship). Same icon set shadcn/ui uses internally. |
| date-fns | 4.x | Date formatting/manipulation | Order dates, listing expiry, "posted X ago" displays. Tree-shakable (unlike Moment.js). Immutable operations. |

### Contentful Integration

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| contentful | 11.x | Content Delivery API SDK | Fetching brand descriptions, product catalog data, category taxonomy, marketing copy. Server-side (Express) fetching with response caching. |
| @contentful/rich-text-react-renderer | 16.x | Rich text rendering | Rendering brand description rich text fields as React components. Custom node renderers for embedded assets/entries. |
| @contentful/rich-text-types | 17.x | Rich text type definitions | TypeScript types for Contentful rich text document structure. Required peer dep of the renderer. |

### Auth Integration

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @clerk/clerk-react | 5.x | React auth components | `<SignIn>`, `<SignUp>`, `<UserButton>` components. `useUser()`, `useAuth()` hooks. `<ClerkProvider>` wraps app root. Role-based conditional rendering via session claims. |
| @clerk/express | 2.x | Express auth middleware | `clerkMiddleware()` on all routes (attaches auth to request). `requireAuth()` for protected endpoints. `getAuth(req)` for role checks in handlers. |
| @clerk/themes | 2.x | Clerk component theming | Match Clerk's pre-built components to your Tailwind/shadcn design system. Dark mode support. |

### Email

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| resend | 6.x | Email sending SDK | Server-side (Express) email dispatch for order confirmations, offer notifications, counter-offer alerts. Simple `resend.emails.send()` API. |
| @react-email/components | 1.x | Email template components | Build email templates as React components: `<Html>`, `<Head>`, `<Body>`, `<Container>`, `<Text>`, `<Button>`. Compiles to cross-client HTML. |
| react-email | 5.x | Email template dev server | Local preview server for developing email templates. Hot reload. Not deployed to production. |

### Export & File Generation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| exceljs | 4.x | XLS/XLSX generation | Server-side inventory export. Styled headers, multiple worksheets, number formatting. Stream to Express response for download. Better API than SheetJS for styled reports. |
| jspdf | 4.x | PDF generation (client-side) | Client-side PDF export of inventory details. Lightweight, no server round-trip needed for simple reports. |
| jspdf-autotable | 5.x | PDF table plugin | Formats inventory data into clean PDF tables. Column widths, headers, pagination. Extends jsPDF. |

### Backend Utilities

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cors | 2.x | CORS middleware | Production API: whitelist Vercel frontend origin. Dev: Vite proxy handles CORS, but cors middleware still needed for direct API access. |
| helmet | 8.x | Security headers | Apply to all Express routes. Sets CSP, HSTS, X-Frame-Options, etc. One-liner middleware. |
| express-rate-limit | 8.x | Rate limiting | Protect offer submission, auth endpoints, search from abuse. Configure per-route limits. |
| morgan | 1.x | HTTP request logging | Development and production request logging. Use 'dev' format locally, 'combined' in production. Pipe to Winston in production. |
| winston | 3.x | Structured logging | Production logging with JSON format. Log levels, transports (console + file). Structured context for debugging offer/order flows. |
| express-validator | 7.x | Request validation | Validate/sanitize request bodies, params, query strings. Use alongside Zod for defense-in-depth, or choose one (Zod preferred for shared schemas). |
| dotenv | 17.x | Environment variables | Load .env files in development. Railway injects env vars in production. |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| vitest | 4.x | Test runner | Fast Vite-native testing. Compatible with Jest API. Use for unit tests (schemas, utils) and integration tests (API routes). |
| supertest | 7.x | HTTP assertion library | Test Express API endpoints. Pairs with Vitest for API integration tests. |
| tsx | 4.x | TypeScript execution | Run TypeScript files directly during development. Use for scripts, seeds, one-off tasks. Replaces ts-node. |
| @types/express | 5.x | Express type definitions | TypeScript types for Express 5.x request/response objects. |
| @types/pg | 8.x | pg type definitions | TypeScript types for node-postgres. Drizzle handles most typing, but needed for raw query escape hatches. |
| eslint | 9.x | Code linting | Flat config format (eslint.config.js). Use @typescript-eslint for TS rules. |
| prettier | 3.x | Code formatting | Consistent formatting. Use prettier-plugin-tailwindcss for class sorting. |

## Auth Architecture Decision: publicMetadata RBAC (Not Organizations)

**Decision:** Use Clerk `publicMetadata` with custom role field, not Clerk Organizations.

**Why:**
- AIS has three distinct user roles (Admin, Manufacturer, Retailer) that are **platform-level**, not team/org-level
- Users don't "belong to organizations" -- a Manufacturer IS a manufacturer, a Retailer IS a retailer
- Clerk Organizations adds multi-tenancy complexity (org switching, invitations, org-scoped permissions) that doesn't match this business model
- Organizations is designed for "your customers are teams" (Slack, Notion); this is "your customers are individual businesses with a fixed role"

**Implementation pattern:**
1. Set `publicMetadata.role` to `"admin"` | `"manufacturer"` | `"retailer"` via Clerk Dashboard or Backend API during user onboarding
2. Customize session token in Clerk Dashboard: `{ "metadata": "{{user.public_metadata}}" }`
3. On Express: `getAuth(req).sessionClaims.metadata.role` -- no network request needed
4. On React: `useUser().user.publicMetadata.role` for conditional rendering
5. Express middleware helper: `requireRole('admin')` wrapping `getAuth()` check

**Confidence:** HIGH -- Clerk docs explicitly recommend publicMetadata for this pattern. Organizations is overkill here.

## Search Architecture Decision: PostgreSQL tsvector (Not Elasticsearch)

**Decision:** Use PostgreSQL native full-text search, not Elasticsearch/Meilisearch/Algolia.

**Why:**
- Product catalog is hybrid: names/descriptions in Contentful, transactional data in PostgreSQL
- Search needs to cover: product name, brand, UPC, description -- sync relevant Contentful text fields into a PostgreSQL `tsvector` column
- At MVP scale (hundreds to low thousands of SKUs), PostgreSQL FTS with GIN indexes delivers millisecond results
- Zero additional infrastructure cost (no Elasticsearch cluster, no Algolia subscription)
- When to reconsider: 100k+ SKUs, fuzzy/typo-tolerant search requirements, faceted search with counts

**Implementation pattern:**
1. Store searchable text in a `search_vector tsvector` column on the inventory/listings table
2. Create a GIN index: `CREATE INDEX idx_search ON listings USING GIN(search_vector)`
3. Update vector on insert/update via trigger or application code
4. Weight product name higher than description: `setweight(to_tsvector(name), 'A') || setweight(to_tsvector(description), 'B')`
5. Query: `WHERE search_vector @@ plainto_tsquery('search terms')`
6. Rank results: `ts_rank(search_vector, query)` for relevance ordering

**Confidence:** HIGH -- PostgreSQL docs, multiple production references confirm this pattern scales well below 100k documents.

## Data Fetching Architecture: TanStack Query + Express REST

**Pattern:**
1. Express API returns JSON from PostgreSQL (Drizzle) and Contentful SDK
2. React frontend uses TanStack Query hooks per resource: `useListings()`, `useOffers()`, `useOrders()`
3. Query keys encode filters: `['listings', { category, brand, search, sort, page }]`
4. Mutations invalidate related queries: `onSuccess: () => queryClient.invalidateQueries(['offers'])`
5. Stale time: 30s for listings (inventory changes), 5s for offers (time-sensitive negotiations)

**Why not tRPC or GraphQL:**
- REST is simpler for a team that may include junior developers
- No need for GraphQL's query flexibility -- data shapes are well-defined
- tRPC requires both ends in TypeScript monorepo -- adds coupling complexity with separate Vercel/Railway deploys
- Shared Zod schemas provide type safety at API boundaries without tRPC

## Installation

```bash
# ===== FRONTEND (React + Vite) =====

# Core
npm install react react-dom

# Routing
npm install react-router-dom

# Data fetching & state
npm install @tanstack/react-query @tanstack/react-table

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# URL state
npm install nuqs

# Auth
npm install @clerk/clerk-react @clerk/themes

# Contentful rendering
npm install @contentful/rich-text-react-renderer @contentful/rich-text-types

# UI utilities
npm install sonner lucide-react date-fns class-variance-authority clsx tailwind-merge

# PDF export (client-side)
npm install jspdf jspdf-autotable

# Dev dependencies
npm install -D typescript @types/react @types/react-dom
npm install -D vite @vitejs/plugin-react
npm install -D tailwindcss @tailwindcss/vite
npm install -D @tanstack/react-query-devtools
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier prettier-plugin-tailwindcss
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom


# ===== BACKEND (Express + PostgreSQL) =====

# Core
npm install express

# Database
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg @types/express

# Auth
npm install @clerk/express

# CMS
npm install contentful

# Email
npm install resend @react-email/components

# Validation
npm install zod

# Security & middleware
npm install cors helmet express-rate-limit morgan
npm install -D @types/cors @types/morgan

# Logging
npm install winston

# Environment
npm install dotenv

# Export
npm install exceljs

# Dev
npm install -D typescript tsx vitest supertest @types/supertest
npm install -D eslint prettier
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Drizzle ORM | Prisma | If team prefers schema-first approach and generated client. Prisma has better docs and larger community, but binary engine adds cold start latency and bundle size. Choose Prisma if developer velocity matters more than runtime performance. |
| Drizzle ORM | Knex.js | If you want a pure query builder without ORM abstractions. Knex is slightly faster in raw benchmarks but lacks Drizzle's TypeScript inference from schema definitions. Choose Knex only if the team already knows it. |
| Express 5 | Fastify | If raw throughput matters. Fastify is ~2x faster than Express for JSON serialization. Choose Fastify for high-traffic APIs. Express wins on ecosystem size and hiring familiarity. |
| TanStack Query | SWR | If you want a smaller bundle and simpler API. SWR lacks mutation support, query invalidation patterns, and devtools that TanStack Query provides. Choose SWR only for read-heavy apps with no complex mutation flows. |
| nuqs | Manual URLSearchParams | If you have 1-2 simple URL params. nuqs adds type safety, serialization, and debouncing that manual approaches require custom code for. Worth the 6kb for any filterable list view. |
| sonner | react-hot-toast | If you want the absolute smallest toast library. Sonner has better animation, accessibility, and stacking. react-hot-toast is 5kb vs Sonner's 7kb -- negligible difference. |
| ExcelJS | SheetJS (xlsx) | If you need to READ Excel files (SheetJS is better at parsing). For WRITE-only (export), ExcelJS has a cleaner API for styled, formatted output. |
| jsPDF (client) | @react-pdf/renderer | If you need complex PDF layouts with React components. @react-pdf/renderer is heavier (200kb+) but supports flexbox layout. jsPDF + autotable is sufficient for inventory detail PDFs. |
| publicMetadata RBAC | Clerk Organizations | If the business model evolves to multi-tenant (e.g., manufacturer teams with sub-users who have different permissions within the same manufacturer account). Organizations adds org-scoped roles, invitations, and switching. Revisit if Phase 2+ requires team management within manufacturer/retailer accounts. |
| PostgreSQL FTS | Meilisearch | If you need typo-tolerant, faceted search with highlighting out of the box. Meilisearch is a separate service ($30+/mo hosted) but provides instant search UX. Consider when SKU count exceeds 50k or users demand "Google-like" search. |
| React Email + Resend | MJML + Nodemailer | If Resend's pricing doesn't work at scale. MJML is an alternative email templating language (not React-based). Nodemailer supports any SMTP provider. More flexibility, more setup. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Sequelize | Legacy ORM with poor TypeScript support, verbose API, and known performance issues with complex queries. Last major innovation was years ago. | Drizzle ORM |
| TypeORM | Buggy TypeScript decorators, inconsistent query builder, known memory leaks in long-running processes. Active maintenance has declined. | Drizzle ORM |
| Moment.js | 300kb+ bundle, mutable API, officially in maintenance mode. The Moment team recommends alternatives. | date-fns |
| Create React App (CRA) | Officially deprecated. No active maintenance. Slow builds, no ESM support, outdated webpack config. | Vite |
| Material UI (MUI) | Heavy bundle (100kb+), opinionated styling that fights Tailwind, complex theme override system. Overkill for a custom-designed marketplace. | shadcn/ui + Tailwind |
| Axios | Unnecessary in 2025. Native `fetch()` is available in Node.js 22+ and all browsers. Axios adds 15kb for features you don't need. | Native fetch (or keep for interceptors if you must -- but TanStack Query handles retries/caching) |
| Redux / Redux Toolkit | Massive boilerplate for server state that TanStack Query handles better. Redux is for complex client-side state (drag-and-drop, multi-step wizards), which this app doesn't have at MVP. | TanStack Query for server state, React context/useState for UI state |
| NextAuth / Auth.js | Designed for Next.js, not Express. Would require significant custom work with a Vite + Express stack. | Clerk |
| Mongoose / MongoDB | Document DB is wrong for transactional data with relationships (orders -> order_items -> offers -> counteroffers). PostgreSQL's relational model with foreign keys and transactions is the correct tool. | PostgreSQL + Drizzle |
| Elasticsearch | Massive operational overhead for a product catalog with < 10k SKUs. PostgreSQL tsvector handles this scale easily. Adds infrastructure cost and complexity. | PostgreSQL full-text search |
| Clerk Organizations | Adds multi-tenancy switching UI/UX complexity that doesn't match the AIS business model. Users have one fixed platform role, not org-scoped roles. | Clerk publicMetadata RBAC |

## Stack Patterns by Variant

**If file uploads needed (Phase 2 -- manufacturer self-serve upload):**
- Use react-dropzone (v15.x) for drag-and-drop file selection on frontend
- Upload images to Contentful Asset API (for product images) or a dedicated object store
- Consider Uploadthing or Cloudinary if Contentful asset limits become a constraint

**If real-time features needed (future -- live offer notifications):**
- Add Socket.io or Server-Sent Events (SSE) to Express
- SSE is simpler for one-way server-to-client notifications (offer accepted, new counter)
- Socket.io only if bidirectional real-time is needed (chat, live negotiation)

**If search needs upgrade (50k+ SKUs):**
- Migrate to Meilisearch (self-hosted on Railway or cloud at meilisearch.com)
- Keep PostgreSQL as source of truth, sync to Meilisearch index
- Frontend: use @meilisearch/instant-meilisearch with instantsearch.js React widgets

**If payment processing added (Phase 3):**
- Stripe for card payments: @stripe/stripe-js (frontend), stripe (backend)
- Stripe Connect for marketplace payouts to manufacturers
- Or Dwolla/Bill.com for ACH if B2B net terms are the payment model

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| drizzle-orm@0.45.x | pg@8.x | Drizzle auto-detects pg Pool. Use `drizzle(process.env.DATABASE_URL)` for simplest setup. |
| drizzle-orm@0.45.x | drizzle-kit@0.31.x | Must keep in sync. drizzle-kit generates migrations from drizzle-orm schema definitions. |
| @tanstack/react-table@8.x | @tanstack/react-query@5.x | Independent packages, no direct dependency. Used together in shadcn Data Table pattern. |
| react-hook-form@7.x | @hookform/resolvers@5.x | resolvers@5.x requires react-hook-form@7.x. |
| @hookform/resolvers@5.x | zod@4.x | Resolvers 5.x supports Zod 4.x via Standard Schema protocol. Verify resolver compatibility if Zod major version changes. |
| @clerk/clerk-react@5.x | @clerk/express@2.x | Same session token format. Frontend ClerkProvider and backend clerkMiddleware share the same JWT. |
| @contentful/rich-text-react-renderer@16.x | @contentful/rich-text-types@17.x | Renderer depends on types package. Install both. |
| contentful@11.x | @contentful/rich-text-types@17.x | SDK returns rich text fields typed by rich-text-types. |
| tailwindcss@4.x | @tailwindcss/vite | Tailwind v4 uses Vite plugin instead of PostCSS. Config is CSS-based (`@theme` directive), not JS-based. |
| shadcn/ui | tailwindcss@4.x | shadcn CLI generates components compatible with Tailwind v4. Run `npx shadcn@latest init` and select Tailwind v4. |
| express@5.x | @types/express@5.x | Types updated for Express 5 API changes (async middleware, removed deprecated methods). |
| react@19.x | react-router-dom@7.x | React Router v7 supports React 19. Use `createBrowserRouter` for data-loading patterns. |

## Contentful Content Model Guidance

**Content types to create in Contentful:**

| Content Type | Fields | Notes |
|-------------|--------|-------|
| Brand | name, slug, logo (Asset), description (Rich Text), heroImage (Asset) | Top-level entity. BrandListings reference a Brand. |
| BrandListing | title, brand (Reference to Brand), category (Reference to Category), products (Reference[] to Product) | Groups products under a brand offering. |
| Product | name, upc, size, description (Rich Text), images (Asset[]), specs (JSON) | Individual SKU in the catalog. Transactional fields (price, qty, status) live in PostgreSQL. |
| Category | name, slug, icon, displayOrder (Integer) | Beauty Tools, Fragrances, Hair Care, etc. Flat taxonomy for MVP. |

**Hydration pattern:**
- Express API fetches from Contentful CDA on listing endpoints
- Merges with PostgreSQL transactional data (price, available_qty, status, negotiation_potential)
- Returns unified JSON to frontend
- Cache Contentful responses (5-15 min TTL) since editorial content changes infrequently

## Monorepo vs Separate Repos

**Recommendation:** Single repo with `packages/` or `apps/` structure using npm workspaces.

**Why:**
- Shared Zod schemas between frontend and backend (the most important reason)
- Shared TypeScript types for API contracts
- Single git history for coordinated frontend/backend changes
- Separate deploy targets (Vercel for frontend, Railway for backend) configured via each platform's root directory setting

**Structure:**
```
ais-marketplace/
  packages/
    shared/          # Zod schemas, TypeScript types, constants
      src/
        schemas/     # Offer, Order, Listing validation schemas
        types/       # API request/response types
        constants/   # Role enums, status enums
  apps/
    web/             # React + Vite frontend
    api/             # Express backend
  package.json       # Workspace root
  tsconfig.base.json # Shared TS config
```

## Sources

- [TanStack Table docs](https://tanstack.com/table/latest) -- data table capabilities, v8 API (HIGH confidence)
- [TanStack Query docs](https://tanstack.com/query/latest) -- caching, mutations, query invalidation (HIGH confidence)
- [Clerk Express middleware reference](https://clerk.com/docs/reference/express/clerk-middleware) -- clerkMiddleware, getAuth, requireAuth (HIGH confidence)
- [Clerk RBAC with metadata](https://clerk.com/docs/guides/secure/basic-rbac) -- publicMetadata role pattern, session token customization (HIGH confidence)
- [Clerk Organizations overview](https://clerk.com/docs/guides/organizations/overview) -- when to use Organizations vs metadata (HIGH confidence)
- [Drizzle ORM PostgreSQL setup](https://orm.drizzle.team/docs/get-started/postgresql-new) -- driver selection, config, schema definition (HIGH confidence)
- [Drizzle ORM migrations](https://orm.drizzle.team/docs/migrations) -- generate, push, migrate workflow (HIGH confidence)
- [Drizzle ORM benchmarks](https://orm.drizzle.team/benchmarks) -- performance vs Prisma, Knex, TypeORM (MEDIUM confidence -- vendor benchmarks)
- [Contentful JavaScript SDK](https://github.com/contentful/contentful.js) -- v11 API, typed responses (HIGH confidence)
- [Contentful rich text renderer](https://www.npmjs.com/package/@contentful/rich-text-react-renderer) -- React rendering, custom node renderers (HIGH confidence)
- [Contentful product catalog example](https://github.com/contentful/product-catalogue-js) -- content modeling for Brand/Product/Category (MEDIUM confidence -- example repo, may be dated)
- [PostgreSQL full-text search docs](https://www.postgresql.org/docs/current/textsearch-intro.html) -- tsvector, tsquery, GIN indexes, weighting (HIGH confidence)
- [Better Stack: Full-text search in Postgres with TypeScript](https://betterstack.com/community/guides/scaling-nodejs/full-text-search-in-postgres-with-typescript/) -- practical Node.js implementation (MEDIUM confidence)
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) -- TanStack Table integration, column definitions (HIGH confidence)
- [shadcn/ui React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form) -- form component integration with Zod (HIGH confidence)
- [nuqs](https://nuqs.dev/) -- type-safe URL state, framework adapters, debouncing (HIGH confidence)
- [Resend Node.js SDK](https://resend.com/docs/send-with-nodejs) -- email sending API (HIGH confidence)
- [React Email](https://react.email/templates) -- component-based email templates (HIGH confidence)
- [ExcelJS GitHub](https://github.com/exceljs/exceljs) -- workbook creation, streaming, styling (HIGH confidence)
- [Drizzle vs Prisma comparison](https://betterstack.com/community/guides/scaling-nodejs/drizzle-vs-prisma/) -- architecture differences, bundle size, cold starts (MEDIUM confidence)
- [Node.js ORM comparison 2025](https://thedataguy.pro/blog/2025/12/nodejs-orm-comparison-2025/) -- ecosystem landscape (MEDIUM confidence)
- npm registry (all version numbers verified via `npm view [package] version` on 2026-03-08) -- (HIGH confidence)

---
*Stack research for: B2B CPG Excess Inventory Marketplace*
*Researched: 2026-03-08*
