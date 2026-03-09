# Roadmap: AIS Marketplace

## Overview

This roadmap delivers a demo-ready B2B marketplace for CPG excess inventory in 7 phases (6 planned + 1 inserted). The build follows architectural dependencies: foundation and auth first, then admin tooling to populate the catalog, then manufacturer self-service with approval workflow (inserted as 2.1), then the public storefront, then purchasing flows, then the core offer negotiation engine with margin transformation, and finally the role-specific portals that complete the demo experience. Every phase delivers a coherent, verifiable capability. All data lives in PostgreSQL for Phase 1 (no CMS).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Auth** - Monorepo scaffolding, PostgreSQL schema, Clerk authentication with three-role RBAC, and companies as first-class entities (completed 2026-03-09)
- [ ] **Phase 2: Admin Catalog Management** - Admin can create, edit, and manage inventory listings, brands, and categories in PostgreSQL
- [ ] **Phase 2.1: Manufacturer Self-Service & Approval Workflow** [INSERTED] - Manufacturers create listings and brands scoped to their company with admin approval workflow; notification inbox with email via Resend
- [ ] **Phase 3: Storefront and Discovery** - Retailers can browse the catalog by brand and category, search products, filter and sort results, and view listing details
- [ ] **Phase 4: Order Builder and Purchase** - Retailers can select SKUs from a listing, build an order with quantities, and complete a Buy Now purchase or initiate an offer
- [ ] **Phase 5: Offer Negotiation and Notifications** - The AIS margin-transformed negotiation engine with multi-round counter support and in-app notifications for all transaction events
- [ ] **Phase 6: Role Portals and Demo Readiness** - Manufacturer portal, admin dashboards, data export, and final demo polish

## Phase Details

### Phase 1: Foundation and Auth
**Goal**: Users can register, authenticate, and be routed to role-appropriate experiences with companies as first-class entities
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. User can create an account with email/password via Clerk and receives email verification
  2. User session persists across browser refresh without re-login
  3. Each user is assigned a role (Admin, Manufacturer, or Retailer) and role-based access control prevents unauthorized access to protected routes
  4. Companies exist as independent entities with name, contact, phone, type, and margin percentage (default 10%); users belong to a company via foreign key
  5. The monorepo builds, the Express API starts, the PostgreSQL database accepts connections, and seed data populates test accounts for all three roles
**Plans**: 5 plans

Plans:
- [ ] 01-00-PLAN.md — Wave 0 test infrastructure (vitest install, config, stub test files)
- [x] 01-01-PLAN.md — Monorepo scaffolding, Turborepo config, and @ais/shared package with types, schemas, and constants
- [x] 01-02-PLAN.md — PostgreSQL schema with Drizzle ORM (companies + users tables, relations, API routes)
- [x] 01-03-PLAN.md — Frontend auth experience (Clerk login page, app shell, sidebar, role dashboards)
- [x] 01-04-PLAN.md — Clerk backend auth (RBAC middleware, webhook, seed script with demo data)

### Phase 2: Admin Catalog Management
**Goal**: Admin can populate and manage the full product catalog through an internal management interface
**Depends on**: Phase 1
**Requirements**: ADMN-01, ADMN-02
**Success Criteria** (what must be TRUE):
  1. Admin can create a new inventory listing with all product fields (name, description, UPC, images, size, case pack, price, MSRP, quantity, expiration date) and it persists in PostgreSQL
  2. Admin can edit and delete existing listings, and changes are reflected immediately
  3. Admin can create, edit, and delete brands and categories, and assign listings to them
**Plans**: 7 plans

Plans:
- [x] 02-00-PLAN.md — Wave 0 test infrastructure (stub test files for all Phase 2 API routes, schemas, and seed)
- [x] 02-01-PLAN.md — Drizzle schema tables (brands, categories, brand_listings, inventory_skus, listing_categories, brand_listing_images)
- [x] 02-02-PLAN.md — Shared types, Zod schemas, constants, dependency install, React Router + sidebar restructure
- [x] 02-03-PLAN.md — Brand and category API routes + shared UI components (DataTable, dialogs, image upload)
- [x] 02-04-PLAN.md — Brand and category frontend (TanStack Query hooks, dialog modals, management pages)
- [x] 02-05-PLAN.md — Inventory listing CRUD (API routes, data table, create/edit pages, inline SKU editor)
- [ ] 02-06-PLAN.md — Seed data and end-to-end admin verification checkpoint

### Phase 2.1: Manufacturer Self-Service & Approval Workflow [INSERTED]
**Goal**: Manufacturers can create listings and brands scoped to their company, with admin approval workflow and notification inbox for all users
**Depends on**: Phase 2
**Requirements**: MFSS-01, MFSS-02, MFSS-03, MFSS-04, APRV-01, APRV-02, APRV-03, APRV-04, APRV-05, APRV-06, APRV-07, NINB-01, NINB-02, NINB-03, NINB-04, NINB-05
**Success Criteria** (what must be TRUE):
  1. Manufacturer can create listings and brands from manage pages, scoped to their own company, and items enter "pending_approval" status automatically
  2. Manufacturer manage pages show only their company's data; categories are read-only (assign only, no create/edit/delete)
  3. Admin sees pending submissions in a dedicated review queue and can approve (activate), reject (with reason), or edit before deciding
  4. SKUs inherit listing approval status; admin-created items bypass approval and go directly to active
  5. All users have a notification inbox accessible from sidebar with unread count badge
  6. Admin receives notification on new submissions; manufacturer receives notification on approval/rejection (with reason)
  7. Email notifications are sent via Resend for all approval workflow events
**Plans**: TBD

Plans:
- [ ] 02.1-01: TBD during planning

### Phase 3: Storefront and Discovery
**Goal**: Retailers can discover and evaluate available CPG inventory through a professional browsing and search experience
**Depends on**: Phase 2
**Requirements**: CATL-01, CATL-02, CATL-03, CATL-04, SRCH-01, SRCH-02, SRCH-03, SRCH-04, LIST-01, LIST-02, LIST-03
**Success Criteria** (what must be TRUE):
  1. Main shop page displays available inventory grouped by brand and/or category with visual cards for navigation
  2. Individual brand pages show brand description, logo, and imagery; category pages show all listings within each CPG vertical
  3. Full-text search returns relevant results when searching by product name, brand, UPC, or description
  4. Retailer can filter results by category and brand, and sort by Featured, Newest, Price, Discount %, or Units available
  5. Listing detail page displays all product fields: images, description, UPC, size, case pack, expiration date, MSRP, listing price, % off MSRP, and available quantity
**Plans**: TBD

Plans:
- [ ] 03-01: Catalog API endpoints and data hydration
- [ ] 03-02: Shop page, brand pages, and category pages
- [ ] 03-03: Full-text search and filter/sort system
- [ ] 03-04: Listing detail page

### Phase 4: Order Builder and Purchase
**Goal**: Retailers can select SKUs from a listing, configure quantities, and complete a Buy Now purchase at listing price
**Depends on**: Phase 3
**Requirements**: ORDR-01, ORDR-02, ORDR-03, ORDR-04, ORDR-05
**Success Criteria** (what must be TRUE):
  1. BrandListing page presents a table of all available InventorySKUs with selectable rows
  2. Retailer can select multiple SKUs and specify quantity per SKU, with the running order summary updating in real time (per-SKU totals and grand total)
  3. Retailer can click Buy Now to purchase at listing price and receives an order confirmation with order details
  4. Retailer can click Make an Offer to submit selected SKUs and proposed prices, which initiates the negotiation flow
**Plans**: TBD

Plans:
- [ ] 04-01: Order Builder UI and real-time summary
- [ ] 04-02: Buy Now flow and order confirmation
- [ ] 04-03: Make Offer submission flow

### Phase 5: Offer Negotiation and Notifications
**Goal**: Retailers and Manufacturers can negotiate through the AIS margin-transformed offer system, and all users receive in-app notifications for transaction events
**Depends on**: Phase 4
**Requirements**: OFFR-01, OFFR-02, OFFR-03, OFFR-04, OFFR-05, OFFR-06, NOTF-01, NOTF-02, NOTF-03
**Success Criteria** (what must be TRUE):
  1. Retailer's submitted offer has the manufacturer's company-specific AIS margin (default 10%) automatically added before the Manufacturer sees it; the Retailer never sees the margin-adjusted price
  2. Manufacturer can accept, decline, or counter an offer; counteroffers have the company-specific AIS margin stripped before the Retailer sees them
  3. Negotiation supports multiple rounds of counter/response until one party accepts or declines
  4. An accepted offer automatically converts to a confirmed order with inventory decremented
  5. In-app notifications are delivered for all transaction events (offer received, accepted, declined, countered, order confirmed) and cannot be disabled
**Plans**: TBD

Plans:
- [ ] 05-01: Offer state machine and margin transformation logic
- [ ] 05-02: Offer API endpoints and negotiation flow
- [ ] 05-03: In-app notification system

### Phase 6: Role Portals and Demo Readiness
**Goal**: Manufacturers and Admins have dedicated portal views into their data, export functionality works, and the application is demo-ready with complete sample data
**Depends on**: Phase 5
**Requirements**: MFPR-01, MFPR-02, ADMN-03, ADMN-04, ADMN-05, EXPT-01, EXPT-02
**Success Criteria** (what must be TRUE):
  1. Manufacturer can view their own inventory listings with status (active, sold, pending) from their portal
  2. Manufacturer can receive, view, accept, decline, and counter offers directly from their portal interface
  3. Admin can view all offers, counteroffers, and statuses in a read-only dashboard; admin can view and manage registered users and their roles
  4. Admin can set a custom AIS margin percentage per company (defaults to 10%)
  5. Retailer can export inventory details as an XLS spreadsheet containing Product Description, UPC, Size, Case Pack, Expiration, Price, Qty, and Total
  6. The full demo flow works end-to-end: admin creates listings, retailer browses and submits offer, manufacturer receives and responds, order confirms, notifications fire
**Plans**: TBD

Plans:
- [ ] 06-01: Manufacturer portal
- [ ] 06-02: Admin offer dashboard and user management
- [ ] 06-03: XLS export service
- [ ] 06-04: Demo data and end-to-end verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 2.1 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Auth | 5/5 | Complete   | 2026-03-09 |
| 2. Admin Catalog Management | 6/7 | In Progress|  |
| 2.1. Manufacturer Self-Service & Approval Workflow | 0/? | Not started | - |
| 3. Storefront and Discovery | 0/4 | Not started | - |
| 4. Order Builder and Purchase | 0/3 | Not started | - |
| 5. Offer Negotiation and Notifications | 0/3 | Not started | - |
| 6. Role Portals and Demo Readiness | 0/4 | Not started | - |
