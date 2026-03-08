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
- [ ] Contentful-powered brand and product catalog with editorial content management
- [ ] PostgreSQL-backed inventory, order, and offer transactional data (hybrid with Contentful)
- [ ] Main shop page with brand/category browsing, hero/featured sections
- [ ] Full-text search across product name, brand, UPC, description
- [ ] Category and brand filtering with sort (Featured, Newest, Price, Discount %, Units)
- [ ] Listing detail view with all product fields, pricing, restrictions, and negotiation indicator
- [ ] Order Builder — per-BrandListing SKU selection with quantity, real-time summary, Buy Now or Make Offer
- [ ] Buy Now flow — immediate purchase at listing price with order confirmation
- [ ] Best Offer flow — Retailer proposes price, AIS 10% margin auto-added, Manufacturer accepts/counters/declines
- [ ] Manufacturer portal — view inventory status, receive offers, accept/decline/counter
- [ ] Admin inventory management — create/edit/delete listings in Contentful, set negotiation potential, restrictions, FOB
- [ ] Admin offer visibility dashboard — read-only view of all offers and statuses
- [ ] In-app notifications for all transaction events (always on)
- [ ] Email notifications via Resend for transaction events (toggleable per user preference)
- [ ] Export inventory details as XLS and PDF

### Out of Scope

- Persistent cross-listing cart — Order Builder is scoped per BrandListing, no session/cross-listing state
- Manufacturer self-serve inventory upload — Phase 2 (Admin enters manually in MVP)
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

**Business model:** AIS is the intermediary — not a two-sided marketplace where buyers and sellers transact directly. AIS adds a 10% margin to all transactions. On Buy Now, the listing price already includes the margin. On offers, AIS adds 10% to the Retailer's proposed price before showing it to the Manufacturer. On counteroffers, AIS strips the margin before showing the Manufacturer's counter to the Retailer. The Manufacturer never sees the Retailer's raw price; the Retailer never sees the Manufacturer's raw price.

**Offer negotiation flow:**
1. Retailer submits offer (quantity + proposed unit price per selected SKU)
2. System adds 10% AIS margin → Manufacturer sees margin-inclusive price
3. Manufacturer accepts, declines, or counters (at the margin-inclusive number)
4. If countered → system strips margin → Retailer sees margin-adjusted counter
5. Loop until accepted or declined
6. Accepted offer becomes an order → AIS processes and ships

**Data architecture (hybrid):**
- **Contentful** owns: Brand descriptions, marketing copy, brand/product imagery, category taxonomy, marketing bulletins, retail campaign content
- **PostgreSQL** owns: Users/roles, inventory SKU transactional data (quantity, price, status), orders, order items, offers, offer items, counteroffers, notifications, notification preferences, audit logs
- Frontend hydrates pages from both sources. Product catalog fields (name, UPC, size, description, images) live in Contentful; transactional fields (available qty, current price, status) live in PostgreSQL.

**Phase 1 target:** Demo-ready application with sample data to pitch to manufacturers and retailers. Not yet handling real transactions.

**Design references:**
- [highstock.com](https://highstock.com) — marketplace browsing UX, listing structure, inventory discovery
- [range.me](https://range.me) — retail campaign functionality, brand presentation (Phase 2 reference)

**CPG Categories:** Beauty Tools, Fragrances, Hair Care, Health & Wellness, Makeup, Nail Care, Skincare

## Constraints

- **Tech stack**: React + TypeScript (Vite), Node.js + Express REST API, PostgreSQL, Contentful CMS, Clerk Auth, Resend email, Tailwind CSS + shadcn/ui
- **Hosting**: Vercel (frontend, Pro plan required), Railway (API + PostgreSQL, early stage)
- **Contentful rate limits**: No high-frequency writes to Contentful — all transactional data in PostgreSQL
- **Budget**: Minimize infrastructure costs for demo/early stage — Vercel Pro ($20/mo), Railway usage-based, Contentful free tier, Clerk free tier, Resend free tier (3k emails/mo)
- **Auth migration path**: Clerk for MVP; Auth0 if enterprise SSO (SAML/LDAP) needed later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clerk for auth | Native Vite/React + Node/Express SDKs, built-in RBAC, simpler than Auth0 for MVP | — Pending |
| Hybrid Contentful + PostgreSQL | Contentful for editorial content, PostgreSQL for transactional data — avoids rate limit issues on purchases | — Pending |
| No persistent cart | Order Builder scoped per BrandListing simplifies UX and avoids cross-listing complexity | — Pending |
| Admin manual inventory entry (Phase 1) | Lowest friction to get demo-ready MVP; Manufacturer upload portal deferred to Phase 2 | — Pending |
| Manufacturer negotiates directly | Manufacturer accepts/declines/counters in their own portal; Admin is read-only observer | — Pending |
| Resend for email | Clean Node.js SDK, free tier covers early stage (3k/mo), scales to $20/mo for 50k | — Pending |
| Railway for backend hosting | Usage-based pricing minimizes early-stage costs; evaluate Render or AWS as traffic grows | — Pending |
| Tailwind + shadcn/ui | Utility-first CSS with polished accessible components, strong React/TypeScript ecosystem | — Pending |

---
*Last updated: 2026-03-08 after initialization*
