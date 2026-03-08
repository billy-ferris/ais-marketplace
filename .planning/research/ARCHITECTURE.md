# Architecture Research

**Domain:** B2B CPG Excess Inventory Marketplace (Hybrid CMS + Transactional Database)
**Researched:** 2026-03-08
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (React + Vite)                        │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Retailer    │  │ Manufacturer │  │   Admin      │  │   Public     │    │
│  │  Storefront  │  │   Portal     │  │  Dashboard   │  │   Pages      │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │                 │            │
│  ┌──────┴─────────────────┴──────────────────┴─────────────────┴───────┐    │
│  │                    Shared API Client Layer                          │    │
│  │         (TanStack Query + Axios/Fetch + Auth Interceptor)          │    │
│  └────────────────────────────┬────────────────────────────────────────┘    │
└───────────────────────────────┼─────────────────────────────────────────────┘
                                │ HTTPS (REST)
┌───────────────────────────────┼─────────────────────────────────────────────┐
│                          API LAYER (Express)                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Clerk Middleware (session JWT validation, auth state on req)       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  RBAC Middleware (role check: Admin / Manufacturer / Retailer)      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │  Catalog   │ │  Offers    │ │  Orders    │ │  Users &   │              │
│  │  Routes    │ │  Routes    │ │  Routes    │ │  Notifs    │              │
│  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘              │
│        │              │              │              │                      │
│  ┌─────┴──────────────┴──────────────┴──────────────┴──────────────────┐   │
│  │                       Service Layer                                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │ Catalog  │ │  Offer   │ │  Order   │ │  Notif   │ │  Export  │  │   │
│  │  │ Service  │ │  Service │ │  Service │ │  Service │ │  Service │  │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │   │
│  └───────┼────────────┼────────────┼────────────┼────────────┼─────────┘   │
│          │            │            │            │            │              │
│  ┌───────┴────────────┴────────────┴────────────┴────────────┴─────────┐   │
│  │                      Data Access Layer                               │   │
│  │  ┌──────────────────┐         ┌──────────────────┐                   │   │
│  │  │  Contentful      │         │   PostgreSQL     │                   │   │
│  │  │  Client          │         │   Client (pg)    │                   │   │
│  │  │  (editorial)     │         │   (transactional)│                   │   │
│  │  └──────────────────┘         └──────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                            │
         ┌──────────┘                            └──────────┐
         ▼                                                  ▼
┌──────────────────┐                            ┌──────────────────┐
│    Contentful    │                            │   PostgreSQL     │
│    (CDN-backed)  │                            │   (Railway)      │
│                  │                            │                  │
│  - Brands        │                            │  - users         │
│  - Products      │                            │  - inventory     │
│  - Categories    │                            │  - offers        │
│  - Images        │                            │  - offer_items   │
│  - Marketing     │                            │  - orders        │
│    copy          │                            │  - order_items   │
└──────────────────┘                            │  - notifications │
                                                │  - audit_logs    │
         ┌──────────────────────┐               └──────────────────┘
         │    Clerk             │
         │    (Auth SaaS)      │
         │                     │
         │  - Users/sessions   │
         │  - Organization     │
         │    roles            │
         │  - JWT issuance     │
         └──────────────────────┘

         ┌──────────────────────┐
         │    Resend            │
         │    (Email SaaS)     │
         │                     │
         │  - Transactional    │
         │    emails           │
         └──────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| **Retailer Storefront** | Browse catalog, search/filter, Order Builder, submit offers, view orders | API Layer (all catalog + offer + order endpoints) |
| **Manufacturer Portal** | View own inventory status, receive/respond to offers, view orders | API Layer (offer + order endpoints, filtered by manufacturer) |
| **Admin Dashboard** | Manage listings (via Contentful), view all offers (read-only), manage users | API Layer (all endpoints), Contentful Management API |
| **API Layer (Express)** | Route handling, auth enforcement, request validation, response formatting | Service Layer, Clerk, all data stores |
| **Service Layer** | Business logic, margin calculations, state machine transitions, data hydration | Data Access Layer, Resend |
| **Catalog Service** | Hydrate Contentful editorial data with PostgreSQL transactional data (qty, price, status) | Contentful Client, PostgreSQL Client |
| **Offer Service** | Manage offer state machine, apply/strip AIS 10% margin, enforce inventory availability | PostgreSQL Client |
| **Order Service** | Convert accepted offers to orders, handle Buy Now, atomic inventory decrement | PostgreSQL Client |
| **Notification Service** | Create in-app notifications, trigger email via Resend based on user preferences | PostgreSQL Client, Resend |
| **Export Service** | Generate XLS and PDF exports of inventory data | Contentful Client, PostgreSQL Client |
| **Contentful** | Store and serve editorial content (brand info, product descriptions, images, categories) | API Layer (via Delivery API) |
| **PostgreSQL** | Store and serve transactional data (inventory, offers, orders, users, notifications) | API Layer (via pg client or query builder) |
| **Clerk** | Issue and validate session JWTs, manage user identities, provide RBAC metadata | API Layer (via @clerk/express middleware) |
| **Resend** | Deliver transactional emails (offer received, accepted, countered, order confirmed) | Notification Service (via Resend Node SDK) |

## Recommended Project Structure

Use a monorepo with shared types between frontend and backend. No monorepo tooling (Turborepo, Nx) needed at this scale -- npm workspaces suffice.

```
ais-marketplace/
├── packages/
│   └── shared/                  # Shared TypeScript types and constants
│       ├── types/
│       │   ├── catalog.ts       # Brand, Product, Listing, Category types
│       │   ├── offers.ts        # Offer, OfferItem, CounterOffer types + status enum
│       │   ├── orders.ts        # Order, OrderItem types + status enum
│       │   ├── users.ts         # User, Role types
│       │   └── notifications.ts # Notification types
│       ├── constants/
│       │   ├── roles.ts         # ADMIN, MANUFACTURER, RETAILER
│       │   ├── offer-states.ts  # State machine transition map
│       │   └── categories.ts    # CPG category slugs
│       ├── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── web/                     # React + Vite frontend
│   │   ├── src/
│   │   │   ├── api/             # API client, TanStack Query hooks
│   │   │   │   ├── client.ts    # Axios instance with Clerk auth interceptor
│   │   │   │   ├── catalog.ts   # useListings, useBrand, useSearch hooks
│   │   │   │   ├── offers.ts    # useCreateOffer, useRespondOffer hooks
│   │   │   │   └── orders.ts    # useCreateOrder, useOrders hooks
│   │   │   ├── components/      # Shared UI components (shadcn/ui based)
│   │   │   │   ├── ui/          # shadcn/ui primitives (Button, Dialog, etc.)
│   │   │   │   ├── layout/      # Shell, Navbar, Sidebar, Footer
│   │   │   │   └── shared/      # Domain components (ListingCard, OfferBadge)
│   │   │   ├── features/        # Feature modules (co-locate route + logic)
│   │   │   │   ├── catalog/     # Shop page, search, filters, listing detail
│   │   │   │   ├── order-builder/ # Per-BrandListing SKU selection + summary
│   │   │   │   ├── offers/      # Offer submission, offer responses
│   │   │   │   ├── orders/      # Order history, order detail
│   │   │   │   ├── manufacturer/ # Manufacturer portal views
│   │   │   │   ├── admin/       # Admin dashboard views
│   │   │   │   └── notifications/ # Notification center
│   │   │   ├── hooks/           # Shared custom hooks
│   │   │   ├── lib/             # Utilities, formatters, margin helpers
│   │   │   ├── providers/       # ClerkProvider, QueryClientProvider, etc.
│   │   │   ├── routes/          # Route definitions (React Router)
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── api/                     # Express REST API
│       ├── src/
│       │   ├── middleware/       # Clerk auth, RBAC, error handler, validation
│       │   │   ├── auth.ts      # clerkMiddleware() + getAuth() helpers
│       │   │   ├── rbac.ts      # requireRole('admin'), requireRole('manufacturer')
│       │   │   ├── validate.ts  # Zod schema validation middleware
│       │   │   └── error.ts     # Global error handler
│       │   ├── routes/          # Express route definitions
│       │   │   ├── catalog.ts   # GET /listings, GET /listings/:id, GET /brands
│       │   │   ├── offers.ts    # POST /offers, PATCH /offers/:id, GET /offers
│       │   │   ├── orders.ts    # POST /orders, GET /orders, GET /orders/:id
│       │   │   ├── users.ts     # GET /users/me, PATCH /users/me/preferences
│       │   │   ├── notifications.ts # GET /notifications, PATCH read status
│       │   │   ├── export.ts    # GET /export/inventory/:format
│       │   │   └── admin.ts     # Admin-only endpoints
│       │   ├── services/        # Business logic layer
│       │   │   ├── catalog.service.ts    # Contentful + PG hydration
│       │   │   ├── offer.service.ts      # Offer state machine + margin logic
│       │   │   ├── order.service.ts      # Order creation + inventory decrement
│       │   │   ├── notification.service.ts # In-app + email dispatch
│       │   │   └── export.service.ts     # XLS/PDF generation
│       │   ├── db/              # Database layer
│       │   │   ├── client.ts    # pg Pool or Knex connection
│       │   │   ├── migrations/  # Schema migrations
│       │   │   ├── seeds/       # Demo seed data
│       │   │   └── queries/     # Named query functions per entity
│       │   ├── contentful/      # Contentful integration
│       │   │   ├── client.ts    # Contentful Delivery API client
│       │   │   ├── cache.ts     # In-memory TTL cache for Contentful responses
│       │   │   └── mappers.ts   # Transform Contentful entries to app types
│       │   ├── email/           # Resend integration
│       │   │   ├── client.ts    # Resend SDK client
│       │   │   └── templates.ts # Email template builders
│       │   ├── lib/             # Shared utilities
│       │   │   ├── margin.ts    # AIS 10% margin add/strip functions
│       │   │   └── errors.ts    # Custom error classes
│       │   └── server.ts        # Express app setup + middleware chain
│       ├── tsconfig.json
│       └── package.json
│
├── package.json                 # Workspace root
├── tsconfig.base.json           # Shared TS config
└── .env.example                 # Environment variable template
```

### Structure Rationale

- **`packages/shared/`:** Single source of truth for TypeScript types shared between frontend and backend. Prevents type drift. Contains offer state enum, role constants, and all entity interfaces. No monorepo tool overhead -- npm workspaces with `"@ais/shared": "workspace:*"` suffices.
- **`apps/web/features/`:** Feature-based organization co-locates route components, local state, and feature-specific logic. Each feature folder maps to a distinct user workflow (catalog browsing, order building, offer management). Avoids the "components with 200 files" anti-pattern.
- **`apps/api/services/`:** Service layer isolates business logic from route handlers. Routes handle HTTP concerns (parsing, status codes); services handle domain logic (margin calculations, state transitions, inventory checks). This separation makes business rules testable without HTTP overhead.
- **`apps/api/contentful/`:** Dedicated Contentful integration module with its own client, cache, and mappers. Contentful responses have a unique entry structure that needs mapping to application types. The cache module is critical -- Contentful Delivery API is CDN-backed but adding a server-side TTL cache (60-300s) reduces API calls further and protects against rate limits.
- **`apps/api/db/queries/`:** Named query functions (not raw SQL strings in services). Each entity gets a query file (`listings.queries.ts`, `offers.queries.ts`). This keeps SQL organized and makes it easy to add indexes or optimize later.

## Architectural Patterns

### Pattern 1: Server-Side Data Hydration (Contentful + PostgreSQL Merge)

**What:** The API server fetches editorial content from Contentful and transactional data from PostgreSQL in parallel, then merges them into a single response object before sending to the client. The frontend never calls Contentful directly.

**When to use:** Any endpoint that returns catalog/listing data (shop page, listing detail, brand page, search results).

**Trade-offs:**
- Pro: Frontend gets one unified response per request. No client-side orchestration of two data sources. Simpler frontend code.
- Pro: API server can cache Contentful responses aggressively (content changes infrequently). PostgreSQL data is always fresh.
- Pro: Contentful API keys stay server-side. No CORS configuration for Contentful.
- Con: API server is an extra hop between client and Contentful CDN. Acceptable for this scale.
- Con: If Contentful is down, listing endpoints fail. Mitigate with cache.

**Example:**
```typescript
// catalog.service.ts
import { contentfulClient } from '../contentful/client';
import { contentfulCache } from '../contentful/cache';
import { mapContentfulListing } from '../contentful/mappers';
import { db } from '../db/client';

export async function getListingById(contentfulId: string) {
  // Parallel fetch from both data sources
  const [contentfulEntry, inventoryRows] = await Promise.all([
    contentfulCache.getOrFetch(contentfulId, () =>
      contentfulClient.getEntry(contentfulId)
    ),
    db.query(
      'SELECT sku, available_qty, unit_price, status FROM inventory WHERE contentful_listing_id = $1',
      [contentfulId]
    ),
  ]);

  // Merge into single response shape
  const editorial = mapContentfulListing(contentfulEntry);
  return {
    ...editorial,                    // name, description, images, brand, category
    skus: inventoryRows.rows.map(row => ({
      sku: row.sku,
      availableQty: row.available_qty,
      unitPrice: row.unit_price,
      status: row.status,
    })),
  };
}
```

### Pattern 2: Offer State Machine (Explicit Transition Map)

**What:** Offers follow a finite state machine with explicit allowed transitions. Every state change is validated against the transition map before being persisted. The transition map lives in shared code so both frontend and backend agree on valid states.

**When to use:** All offer status changes (submit, accept, decline, counter, expire, cancel).

**Trade-offs:**
- Pro: Invalid transitions are impossible. Cannot "accept" an already-declined offer.
- Pro: Transition map is a simple object -- easy to test, easy to reason about.
- Pro: Shared between frontend (for UI state) and backend (for enforcement).
- Con: Adding new states requires updating the map in shared code. Acceptable -- state changes are infrequent and important.

**Example:**
```typescript
// packages/shared/constants/offer-states.ts
export enum OfferStatus {
  PENDING = 'pending',                   // Retailer submitted, awaiting Manufacturer
  ACCEPTED = 'accepted',                 // Manufacturer accepted
  DECLINED = 'declined',                 // Manufacturer declined
  COUNTERED = 'countered',              // Manufacturer countered
  COUNTER_PENDING = 'counter_pending',   // Retailer reviewing counter
  COUNTER_ACCEPTED = 'counter_accepted', // Retailer accepted counter
  COUNTER_DECLINED = 'counter_declined', // Retailer declined counter
  EXPIRED = 'expired',                   // TTL exceeded
  CANCELLED = 'cancelled',              // Retailer withdrew
}

// Valid transitions: { [currentState]: allowedNextStates[] }
export const OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  [OfferStatus.PENDING]:          [OfferStatus.ACCEPTED, OfferStatus.DECLINED, OfferStatus.COUNTERED, OfferStatus.EXPIRED, OfferStatus.CANCELLED],
  [OfferStatus.COUNTERED]:        [OfferStatus.COUNTER_PENDING],
  [OfferStatus.COUNTER_PENDING]:  [OfferStatus.COUNTER_ACCEPTED, OfferStatus.COUNTER_DECLINED, OfferStatus.EXPIRED],
  [OfferStatus.COUNTER_ACCEPTED]: [],  // terminal
  [OfferStatus.COUNTER_DECLINED]: [OfferStatus.PENDING],  // Retailer can re-offer
  [OfferStatus.ACCEPTED]:         [],  // terminal
  [OfferStatus.DECLINED]:         [],  // terminal
  [OfferStatus.EXPIRED]:          [],  // terminal
  [OfferStatus.CANCELLED]:        [],  // terminal
};

export function canTransition(from: OfferStatus, to: OfferStatus): boolean {
  return OFFER_TRANSITIONS[from]?.includes(to) ?? false;
}
```

```typescript
// apps/api/services/offer.service.ts
import { OfferStatus, canTransition } from '@ais/shared';
import { applyMargin, stripMargin } from '../lib/margin';

export async function respondToOffer(
  offerId: string,
  action: 'accept' | 'decline' | 'counter',
  counterPrice?: number
) {
  const offer = await db.query('SELECT * FROM offers WHERE id = $1 FOR UPDATE', [offerId]);

  const targetStatus = action === 'accept' ? OfferStatus.ACCEPTED
    : action === 'decline' ? OfferStatus.DECLINED
    : OfferStatus.COUNTERED;

  if (!canTransition(offer.status as OfferStatus, targetStatus)) {
    throw new InvalidTransitionError(offer.status, targetStatus);
  }

  if (action === 'counter' && counterPrice) {
    // Manufacturer counters at margin-inclusive price
    // Strip margin before showing to Retailer
    const retailerPrice = stripMargin(counterPrice, 0.10);
    await db.query(
      'UPDATE offers SET status = $1, counter_price = $2, retailer_counter_price = $3 WHERE id = $4',
      [targetStatus, counterPrice, retailerPrice, offerId]
    );
  }
  // ...
}
```

### Pattern 3: RBAC Middleware Chain (Clerk + Custom Role Guard)

**What:** Authentication and authorization are separate middleware layers. `clerkMiddleware()` runs globally to parse JWTs and attach auth state. A custom `requireRole()` middleware checks the user's role from Clerk metadata against the required role for the route.

**When to use:** Every protected API route.

**Trade-offs:**
- Pro: Clean separation -- Clerk handles "who is this?" and custom middleware handles "can they do this?"
- Pro: Route definitions read declaratively: `router.get('/admin/offers', requireRole('admin'), handler)`
- Pro: Clerk manages the identity lifecycle (signup, login, sessions). We only store a `clerk_user_id` foreign key in PostgreSQL.
- Con: Role metadata must be synced between Clerk and PostgreSQL. Use Clerk webhooks to keep in sync.

**Example:**
```typescript
// apps/api/middleware/auth.ts
import { clerkMiddleware, getAuth } from '@clerk/express';

// Apply globally in server.ts: app.use(clerkMiddleware())

// apps/api/middleware/rbac.ts
import { getAuth, clerkClient } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await clerkClient.users.getUser(userId);
    const userRole = user.publicMetadata.role as string;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.userRole = userRole;  // Attach for downstream use
    next();
  };
}
```

### Pattern 4: Atomic Inventory Decrement (PostgreSQL Row Locking)

**What:** When an order is placed (Buy Now or accepted offer), inventory quantity is decremented within a database transaction using `SELECT ... FOR UPDATE` to lock the row, check availability, and decrement atomically.

**When to use:** Buy Now purchases and offer-to-order conversions.

**Trade-offs:**
- Pro: Prevents overselling. Two concurrent purchases on the same SKU cannot both succeed if only one unit remains.
- Pro: PostgreSQL row-level locks are lightweight and release on commit/rollback.
- Con: Under high concurrency on the same SKU, transactions will queue. Acceptable for this marketplace's expected volume.

**Example:**
```typescript
// apps/api/services/order.service.ts
export async function createOrder(items: OrderItemInput[]) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of items) {
      // Lock the inventory row
      const result = await client.query(
        'SELECT available_qty FROM inventory WHERE sku = $1 FOR UPDATE',
        [item.sku]
      );

      if (result.rows[0].available_qty < item.quantity) {
        throw new InsufficientInventoryError(item.sku, result.rows[0].available_qty);
      }

      // Atomic decrement
      await client.query(
        'UPDATE inventory SET available_qty = available_qty - $1 WHERE sku = $2',
        [item.quantity, item.sku]
      );
    }

    // Create order and order_items records
    const order = await client.query(
      'INSERT INTO orders (retailer_id, status, total) VALUES ($1, $2, $3) RETURNING *',
      [retailerId, 'confirmed', total]
    );
    // ... insert order_items

    await client.query('COMMIT');
    return order.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

## Data Flow

### Catalog Browsing Flow (Shop Page)

```
Retailer (Browser)
    │
    │  GET /api/listings?category=skincare&sort=newest&page=1
    ▼
Express Router (catalog.ts)
    │
    │  clerkMiddleware() → getAuth() (optional auth, public route)
    ▼
Catalog Service
    │
    ├──── Contentful Client ──→ Contentful Delivery API
    │     (fetch listings by category,        │
    │      check cache first)                 │
    │     ◄── editorial data ─────────────────┘
    │         (name, description, images, brand)
    │
    ├──── PostgreSQL Client ──→ PostgreSQL
    │     (fetch inventory data for           │
    │      matching contentful IDs)           │
    │     ◄── transactional data ─────────────┘
    │         (qty, price, status per SKU)
    │
    │  MERGE: editorial + transactional → unified listing objects
    ▼
Express Response → JSON
    │
    ▼
React Frontend (TanStack Query)
    │
    │  useListings() hook caches response
    ▼
Listing Grid renders unified data
```

### Offer Negotiation Flow

```
Retailer                     API                      Manufacturer
   │                          │                            │
   │  POST /offers            │                            │
   │  {skus, quantities,      │                            │
   │   unitPrices}            │                            │
   │─────────────────────────►│                            │
   │                          │  1. Validate inventory     │
   │                          │  2. Apply 10% margin       │
   │                          │  3. Create offer (PENDING) │
   │                          │  4. Notify manufacturer    │
   │                          │─────────────────email─────►│
   │                          │                            │
   │                          │  PATCH /offers/:id         │
   │                          │  {action: 'counter',       │
   │                          │   counterPrice: X}         │
   │                          │◄────────────────────────────│
   │                          │  1. Validate transition    │
   │                          │     (PENDING → COUNTERED)  │
   │                          │  2. Strip margin from      │
   │                          │     counter price          │
   │                          │  3. Update offer status    │
   │                          │  4. Notify retailer        │
   │◄────────email────────────│                            │
   │                          │                            │
   │  PATCH /offers/:id       │                            │
   │  {action: 'accept'}      │                            │
   │─────────────────────────►│                            │
   │                          │  1. Validate transition    │
   │                          │     (COUNTER_PENDING →     │
   │                          │      COUNTER_ACCEPTED)     │
   │                          │  2. Convert to order       │
   │                          │  3. Atomic inventory       │
   │                          │     decrement              │
   │                          │  4. Notify both parties    │
   │◄────────email────────────│─────────────email─────────►│
```

### Buy Now Flow

```
Retailer (Order Builder)
    │
    │  POST /orders
    │  {listingId, skus: [{sku, quantity}]}
    ▼
Express Router (orders.ts)
    │
    │  clerkMiddleware() → requireRole('retailer')
    ▼
Order Service
    │
    │  BEGIN TRANSACTION
    │  ├── SELECT ... FOR UPDATE (lock inventory rows)
    │  ├── Validate availability (qty >= requested)
    │  ├── UPDATE inventory SET qty = qty - requested
    │  ├── INSERT INTO orders (...)
    │  ├── INSERT INTO order_items (...)
    │  COMMIT
    │
    │  On success → Notification Service
    │  ├── Create in-app notification (Retailer + Manufacturer)
    │  └── Send email via Resend (if user preference enabled)
    ▼
Express Response → Order confirmation JSON
```

### State Management (Frontend)

```
TanStack Query Cache (server state)
    │
    │  useListings()  → cached listing data
    │  useOffers()    → cached offer data
    │  useOrders()    → cached order data
    │
    ▼
React Components
    │
    │  mutations (useMutation)
    │  ├── createOffer() → POST /offers → invalidate offers cache
    │  ├── respondToOffer() → PATCH /offers/:id → invalidate offers cache
    │  └── createOrder() → POST /orders → invalidate orders + listings cache
    │
    ▼
Local Component State (React useState)
    │
    │  Order Builder quantities (ephemeral, per-BrandListing)
    │  Search/filter form state
    │  Modal open/close state
    │
    ▼
URL State (React Router search params)
    │
    │  ?category=skincare&sort=newest&page=2
    │  (shareable, bookmarkable filter state)
```

**Key principle:** TanStack Query owns all server state. No Redux, no Zustand, no Context for server data. Local UI state uses `useState`. Filter/pagination state lives in URL search params so pages are bookmarkable and shareable.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users (Phase 1 demo) | Monolith is correct. Single Express server, single PostgreSQL instance. Contentful free tier (5 users, 25K API calls/mo). No caching layer needed beyond in-memory TTL cache for Contentful. |
| 100-1K users (early traction) | Add connection pooling to PostgreSQL (pgBouncer or built-in pg pool). Add Redis for Contentful response cache + session cache. Consider read replicas if query load grows. Move to Contentful paid tier. |
| 1K-10K users (growth) | Split API into domain services if team grows (catalog service, order service). Add a job queue (BullMQ + Redis) for email dispatch and export generation. CDN for static assets. Database indexing becomes critical. |
| 10K+ users | Beyond current scope. Would need event-driven architecture, dedicated search (Elasticsearch/Typesense), microservices, etc. |

### Scaling Priorities

1. **First bottleneck -- Contentful API rate limits:** Contentful free tier allows ~55 requests/second to the Delivery API. For catalog-heavy browsing, this is the first limit hit. **Fix:** Server-side TTL cache (in-memory to start, Redis later) with 60-300 second TTL on editorial content. Content changes are infrequent so staleness is acceptable.

2. **Second bottleneck -- PostgreSQL connection exhaustion:** Railway's free/early tiers have limited connections. Multiple concurrent inventory checks + offer state changes can exhaust the pool. **Fix:** Configure pg Pool with appropriate max connections (10-20 for early stage). Use `SELECT ... FOR UPDATE SKIP LOCKED` for queue-like patterns if contention appears.

3. **Third bottleneck -- Email throughput:** Resend free tier caps at 3K emails/month. Active offer negotiation with notifications can burn through this quickly. **Fix:** Move email dispatch to an async queue early (even a simple in-process queue) so email failures do not block API responses. Upgrade Resend tier as needed ($20/mo for 50K).

## Anti-Patterns

### Anti-Pattern 1: Client-Side Contentful Fetching

**What people do:** Have the React frontend call Contentful's Delivery API directly, then call the Express API for transactional data, then merge them client-side.

**Why it's wrong:** Exposes Contentful API keys to the browser. Forces the client to orchestrate two async fetches and handle partial failure states. Doubles the number of network requests for every listing page. Makes caching strategy split between two locations. Prevents the server from doing smart prefetching or batching.

**Do this instead:** All Contentful access goes through the Express API. The Catalog Service hydrates editorial + transactional data server-side and returns a single unified JSON response. The frontend calls one endpoint per page.

### Anti-Pattern 2: Storing Offer State Only in Application Memory

**What people do:** Keep the offer negotiation state in the frontend (React state or context) and only persist the final result.

**Why it's wrong:** Page refresh loses negotiation progress. Multiple browser tabs create divergent state. Backend cannot enforce valid transitions. Audit trail is impossible.

**Do this instead:** Every state transition is a PATCH to the API, persisted in PostgreSQL immediately. The frontend reflects the database state via TanStack Query cache. Offer state is always authoritative in the database.

### Anti-Pattern 3: Mixing Contentful Writes with Transactional Operations

**What people do:** Try to update Contentful entries (via the Management API) as part of order or offer processing -- e.g., decrementing a quantity field stored in Contentful.

**Why it's wrong:** Contentful's Management API is rate-limited (10 requests/second) and not designed for transactional writes. No ACID guarantees. Write conflicts when two users modify the same entry simultaneously. Webhook-based eventual consistency makes real-time impossible.

**Do this instead:** All mutable, transactional data (quantities, prices, statuses, offers, orders) lives in PostgreSQL. Contentful is read-only from the application's perspective (Admin edits content via Contentful's web UI or Management API separately, outside transaction flows).

### Anti-Pattern 4: Global State Store for Server Data

**What people do:** Set up Redux or Zustand to manage listing data, offer data, and order data fetched from the API.

**Why it's wrong:** Duplicates what TanStack Query already does (caching, deduplication, background refetching, stale-while-revalidate). Creates two sources of truth. Requires manual cache invalidation logic. Adds boilerplate for no benefit.

**Do this instead:** TanStack Query is the server state manager. Use `useQuery` for reads, `useMutation` with `invalidateQueries` for writes. Use `useState` for ephemeral UI state (form inputs, modals). Use URL search params for filter/sort/page state.

### Anti-Pattern 5: Thin Routes, Fat Controllers

**What people do:** Put all business logic inside Express route handlers -- validation, database queries, margin calculations, notifications, all in one function.

**Why it's wrong:** Route handlers become 200+ line monoliths. Business logic is untestable without spinning up an HTTP server. Impossible to reuse logic across routes (e.g., inventory check needed in both Buy Now and offer acceptance).

**Do this instead:** Routes handle HTTP concerns (parse params, validate input, set status codes). Services handle business logic (margin calculations, state transitions, inventory checks). Services call data access functions. Each layer is independently testable.

## Integration Points

### External Services

| Service | Integration Pattern | Key Notes |
|---------|---------------------|-----------|
| **Contentful** | Delivery API via `contentful` npm package. Server-side only. TTL cache in front. | Use `include` depth parameter carefully -- deep includes multiply response size. Max include depth is 10, prefer 2-3. Paginate with `skip` + `limit` (max 1000 entries per request). |
| **Clerk** | `@clerk/express` middleware for JWT validation. `@clerk/clerk-react` for frontend auth components (SignIn, UserButton). Webhooks for user sync. | Store `clerk_user_id` in PostgreSQL `users` table as foreign key. Use `publicMetadata.role` for RBAC. Clerk webhook on `user.created` / `user.updated` to sync roles to PostgreSQL. |
| **Resend** | `resend` npm package. Called from Notification Service. | Keep email dispatch async -- do not block API response on email delivery. Use Resend's React Email support for type-safe templates. Free tier: 3K emails/month, 100 emails/day. |
| **Vercel** | Frontend deployment. Git push deploys. Environment variables for API URL. | Set `VITE_API_URL` env var. Configure rewrites/redirects for SPA routing. Pro plan needed for team features. |
| **Railway** | API + PostgreSQL deployment. Git push deploys. | Set DATABASE_URL env var. Enable Railway's built-in PostgreSQL. Use connection pooling. Monitor memory usage -- Railway's free tier has limits. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ API | REST over HTTPS. JSON bodies. Clerk JWT in Authorization header. | Use a typed API client on the frontend that mirrors the shared types. Axios interceptor adds Clerk token automatically. |
| Routes ↔ Services | Direct function calls (same process). | Routes import services. Services never import routes. Services return domain objects, routes format HTTP responses. |
| Services ↔ Data Access | Direct function calls (same process). | Services import query functions from `db/queries/`. Query functions return typed results. Services never write raw SQL -- that stays in query files. |
| Catalog Service ↔ Contentful | HTTP via `contentful` SDK, through TTL cache. | Cache key = Contentful entry ID or query hash. Cache TTL = 60-300s depending on content type. Cache invalidation via Contentful webhook on publish (stretch goal, not needed for MVP). |
| Catalog Service ↔ PostgreSQL | SQL via `pg` client or query builder (Knex/Kysely). | Contentful entry IDs stored in PostgreSQL `inventory` table as `contentful_listing_id` foreign key. This is the join point between the two data sources. |
| Notification Service ↔ Resend | HTTP via `resend` SDK. Fire-and-forget with error logging. | Check user's `notification_preferences` before sending email. Always create in-app notification regardless of email preference. |

## Suggested Build Order

Based on dependency analysis, components should be built in this order:

```
Phase A: Foundation (no dependencies)
├── 1. Shared types package (all other code depends on these types)
├── 2. PostgreSQL schema + migrations (services depend on data layer)
├── 3. Express server skeleton + middleware chain (Clerk + RBAC + error handling)
└── 4. Contentful content model setup (editorial content must exist for catalog)

Phase B: Core Data Flow (depends on Phase A)
├── 5. Contentful client + cache + mappers (needed for catalog hydration)
├── 6. Catalog Service (hydration of Contentful + PostgreSQL) -- most complex integration
├── 7. Catalog API routes (GET /listings, GET /listings/:id, search, filters)
└── 8. Frontend API client + TanStack Query hooks (consumes catalog routes)

Phase C: Storefront UI (depends on Phase B)
├── 9. Shop page (listing grid, category filters, search, sort)
├── 10. Listing detail page (full product info with transactional data)
└── 11. Order Builder (per-BrandListing SKU selection + summary)

Phase D: Transaction Engine (depends on Phase B, parallel with Phase C)
├── 12. Offer state machine + margin logic (core business rules)
├── 13. Offer API routes (POST, PATCH, GET with role-based filtering)
├── 14. Order Service + atomic inventory decrement
├── 15. Order API routes (POST /orders for Buy Now)
└── 16. Notification Service + Resend integration

Phase E: Role-Specific Portals (depends on Phases C + D)
├── 17. Manufacturer portal (offer inbox, accept/decline/counter UI)
├── 18. Admin dashboard (offer visibility, user management)
└── 19. Export Service (XLS/PDF generation)
```

**Key dependency insight:** The Catalog Service (step 6) is the critical path. It proves the hybrid Contentful + PostgreSQL architecture works. Everything else -- storefront, offers, orders -- depends on catalog data flowing correctly. Build and validate this first.

## Sources

- [Contentful Data Model Documentation](https://www.contentful.com/developers/docs/concepts/data-model/)
- [Contentful Advanced Caching](https://www.contentful.com/developers/docs/infrastructure/advanced-caching/)
- [Contentful + GraphQL + Postgres via Hasura](https://www.contentful.com/blog/combining-contentful-graphql-postgres-hasura/) -- pattern reference for hybrid data merging
- [Clerk Express SDK Reference](https://clerk.com/docs/reference/express/overview)
- [Clerk clerkMiddleware() for Express](https://clerk.com/docs/reference/express/clerk-middleware)
- [Clerk requireAuth() for Express](https://clerk.com/docs/reference/express/require-auth)
- [Clerk Organizations RBAC](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions)
- [Clerk Express Quickstart](https://clerk.com/docs/quickstarts/express)
- [Atomic Increment/Decrement Operations in SQL](https://blog.pjam.me/posts/atomic-operations-in-sql/)
- [SELECT FOR UPDATE in PostgreSQL](https://stormatics.tech/blogs/select-for-update-in-postgresql)
- [PostgreSQL Race Conditions](https://oneuptime.com/blog/post/2026-01-25-postgresql-race-conditions/view)
- [TanStack Query Parallel Queries](https://tanstack.com/query/v4/docs/react/guides/parallel-queries)
- [RBAC Implementation in Express.js](https://www.permit.io/blog/how-to-implement-rbac-in-an-expressjs-application)
- [RBAC with Node.js and Postgres](https://axellarsson.com/blog/rbac-and-nodejs/)
- [Express RBAC Middleware Pattern](https://marmelab.com/blog/2025/10/16/rbac-rest-middleware.html)
- [Contentful Content Modeling Patterns](https://www.contentful.com/help/content-modeling-patterns/)
- [Content Modeling in Contentful (Nansen)](https://www.nansen.com/insights/content-modeling-in-contentful)

---
*Architecture research for: AIS Marketplace (B2B CPG Excess Inventory)*
*Researched: 2026-03-08*
