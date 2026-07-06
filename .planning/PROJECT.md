# AIS Marketplace

## What This Is

A B2B marketplace platform that connects CPG Manufacturers with excess, closeout, discontinued, or short-dated inventory to Retailers seeking discounted product — with Alternative Inventory Solutions (AIS) acting as the trusted intermediary. AIS processes all orders, coordinates shipment, and collects a 10% transaction fee. The platform targets the $740B excess inventory problem in the US CPG market.

## Core Value

Retailers can discover and purchase discounted CPG inventory from verified manufacturers through a transparent, friction-free marketplace — with every transaction brokered by AIS.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Three-role RBAC system (Admin, Manufacturer, Retailer) with Clerk authentication
- [ ] PostgreSQL-backed data layer for all product catalog, inventory, order, and offer data (Phase 1)
- [ ] Admin panel for inventory and content management (React-Admin or custom)
- [ ] Main shop page with brand/category browsing, hero/featured sections
- [ ] Full-text search across product name, brand, UPC, description
- [ ] Category and brand filtering with sort (Featured, Newest, Price, Discount %, Units)
- [ ] Listing detail view with all product fields, pricing, restrictions, and negotiation indicator
- [ ] Order Builder — per-BrandListing SKU selection with quantity, real-time summary, Buy Now or Make Offer
- [ ] Buy Now flow — immediate purchase at listing price with order confirmation
- [ ] Best Offer flow — Retailer proposes price, AIS 10% margin auto-added, Manufacturer accepts/counters/declines
- [ ] Manufacturer portal — view inventory status, receive offers, accept/decline/counter
- [ ] Admin inventory management — create/edit/delete listings, set negotiation potential, restrictions, FOB
- [ ] Manufacturer self-service — manufacturers create listings and brands scoped to their company; categories are read-only (assign only)
- [ ] Approval workflow — manufacturer-created listings and brands require admin approval before activation; admin can approve, reject (with reason), or edit during review
- [ ] Notification inbox — dedicated inbox page for all users with sidebar unread badge; in-app and email notifications for approval events
- [ ] Admin offer visibility dashboard — read-only view of all offers and statuses
- [ ] In-app notifications for all transaction events (always on)
- [ ] Email notifications via Resend for transaction events (toggleable per user preference)
- [ ] Export inventory details as XLS and PDF

### Out of Scope

- Persistent cross-listing cart — Order Builder is scoped per BrandListing, no session/cross-listing state
- Manufacturer bulk inventory upload (CSV/XLS) — Phase 2 (manual entry via UI now in v1 Phase 2.1; bulk upload deferred)
- Retail campaigns (RangeMe-style) — Phase 2
- Marketing bulletins — Phase 2
- Admin email blast tool — Phase 2
- Payment processing (Stripe/Dwolla/Bill.com) — Phase 3
- Shipment tracking integration — Phase 3 (AIS coordinates logistics offline in MVP)
- OMS/ERP integration (Ordoro, NetSuite) — Phase 3
- Net terms / trade credit — Phase 3
- OAuth/SSO (SAML/LDAP) — future (Clerk for MVP, Auth0 migration path if needed)
- Mobile app — web-first
- Real-time chat — high complexity, not core
- Video in listings — storage/bandwidth cost

## Context

**Company:** Alternative Inventory Solutions (AIS), founded October 2023 by Dan LeRose (20+ years CPG) and Brandon Ferris (5+ years excess inventory recovery). Tagline: "Your Inventory Solutions Partner."

**Business model:** AIS is the intermediary — not a two-sided marketplace where buyers and sellers transact directly. AIS charges a per-company margin (default 10%, negotiated during onboarding) on all transactions. The margin percentage is stored on the company entity. On Buy Now, the listing price already includes the margin. On offers, the system adds the company-specific margin to the Retailer's proposed price before showing it to the Manufacturer. On counteroffers, the system strips the margin before showing the Manufacturer's counter to the Retailer. The Manufacturer never sees the Retailer's raw price; the Retailer never sees the Manufacturer's raw price.

**Offer negotiation flow:**
1. Retailer submits offer (quantity + proposed unit price per selected SKU)
2. System adds company-specific AIS margin (default 10%) → Manufacturer sees margin-inclusive price
3. Manufacturer accepts, declines, or counters (at the margin-inclusive number)
4. If countered → system strips margin → Retailer sees margin-adjusted counter
5. Loop until accepted or declined
6. Accepted offer becomes an order → AIS processes and ships

**Data architecture:**
- **Phase 1 (PostgreSQL only):** All data lives in PostgreSQL — product catalog, inventory, orders, offers, users, notifications. Images stored in cloud storage (S3/R2), URLs in PostgreSQL. Admin manages content via admin panel (React-Admin or custom).
- **Phase 2+ (add Sanity CMS):** Migrate editorial content (brand descriptions, marketing copy, campaign content, bulletins) to Sanity (free tier, commercial use allowed). PostgreSQL retains all transactional data. Express API hydrates from both sources.

**Phase 1 target:** Demo-ready application with sample data to pitch to manufacturers and retailers. Not yet handling real transactions.

**Design references:**
- [highstock.com](https://highstock.com) — marketplace browsing UX, listing structure, inventory discovery
- [range.me](https://range.me) — retail campaign functionality, brand presentation (Phase 2 reference)

**CPG Categories:** Beauty Tools, Fragrances, Hair Care, Health & Wellness, Makeup, Nail Care, Skincare

## Constraints

- **Tech stack**: React + TypeScript (Vite), Node.js + Express REST API, PostgreSQL, Clerk Auth, Resend email, Tailwind CSS + shadcn/ui. Sanity CMS added in Phase 2 for editorial content.
- **Hosting**: Vercel (frontend, Pro plan required), Railway (API + PostgreSQL, early stage)
- **Budget**: Minimize infrastructure costs for demo/early stage — Vercel Pro ($20/mo), Railway usage-based, Clerk free tier, Resend free tier (3k emails/mo). No CMS cost in Phase 1.
- **Auth migration path**: Clerk for MVP; Auth0 if enterprise SSO (SAML/LDAP) needed later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clerk for auth | Native Vite/React + Node/Express SDKs, built-in RBAC, simpler than Auth0 for MVP | — Pending |
| PostgreSQL only for Phase 1 | Simpler architecture, zero CMS cost, one data source. Contentful free tier prohibits commercial use ($300/mo Lite). Sanity (free, commercial OK) added in Phase 2 for editorial content. | — Pending |
| No persistent cart | Order Builder scoped per BrandListing simplifies UX and avoids cross-listing complexity | — Pending |
| Admin manual inventory entry (Phase 1) | Lowest friction to get demo-ready MVP; manufacturer self-service added in Phase 2.1 with approval workflow | — Pending |
| Manufacturer self-service with approval (Phase 2.1) | Manufacturers create listings/brands scoped to their company; admin approves/rejects. Critical to demo the full business model where both admin and manufacturer can populate the catalog | — Pending |
| Manufacturer negotiates directly | Manufacturer accepts/declines/counters in their own portal; Admin is read-only observer | — Pending |
| Resend for email | Clean Node.js SDK, free tier covers early stage (3k/mo), scales to $20/mo for 50k | — Pending |
| Railway for backend hosting | Usage-based pricing minimizes early-stage costs; evaluate Render or AWS as traffic grows | — Pending |
| Tailwind + shadcn/ui | Utility-first CSS with polished accessible components, strong React/TypeScript ecosystem | — Pending |

| Sanity CMS (Phase 2) | Free tier allows commercial use, $0 through Phase 2. Public datasets only on free (fine for editorial content). $15/seat/month Growth plan if private datasets needed. | — Pending |
| Per-company margin | Margin % negotiated per company during onboarding, stored on company entity, default 10%. More realistic B2B model than flat platform fee. | — Pending |
| Security hardening pass (Phase 02.4) | Closed retro-review criticals before deployment: IDOR (self-or-admin 404 gate), PII/margin redaction, cross-tenant brandId re-validation, HTML/CRLF email escaping, production seed guard, DB-level data-integrity constraints (partial unique indexes + FK onDelete), and upload content-type/size controls. | ✓ Validated — 22/22 threats closed, 171/171 API tests, UAT pass (Phase 02.4) |
| R2 uses presigned PUT, not POST | Cloudflare R2's S3 API does not implement POST Object; presigned POST surfaces as a misleading CORS error. Use presigned PUT with a signed exact ContentLength + pinned ContentType to preserve the D-06 allowlist and D-07 5 MB cap. | ✓ Validated (Phase 02.4) |

---
*Last updated: 2026-07-06 — completed security hardening pass (Phase 02.4)*
