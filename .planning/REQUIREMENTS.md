# Requirements: AIS Marketplace

**Defined:** 2026-03-08
**Core Value:** Retailers can discover and purchase discounted CPG inventory from verified manufacturers through a transparent, friction-free marketplace — with every transaction brokered by AIS.

## v1 Requirements

Requirements for demo-ready MVP. Each maps to roadmap phases.

### Authentication & Users

- [ ] **AUTH-01**: User can create account with email and password via Clerk
- [ ] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User session persists across browser refresh
- [x] **AUTH-04**: Users are assigned one of three roles: Admin, Manufacturer, or Retailer
- [x] **AUTH-05**: Role-based access control enforces permission boundaries between roles
- [x] **AUTH-06**: Companies are first-class entities with company name, contact name, phone, type (manufacturer/retailer), and margin percentage (default 10%)
- [x] **AUTH-07**: Users belong to a company via foreign key. Phase 1 supports one user per company; schema supports multiple users per company for future expansion.

### Catalog & Browsing

- [ ] **CATL-01**: Main shop page displays available inventory grouped by brand and/or category
- [ ] **CATL-02**: Brand and category sections with visual cards for navigation
- [ ] **CATL-03**: Individual brand pages with description, logo, and imagery
- [ ] **CATL-04**: Category pages for CPG verticals (Beauty Tools, Fragrances, Hair Care, Health & Wellness, Makeup, Nail Care, Skincare)

### Search & Discovery

- [ ] **SRCH-01**: Full-text search across product name, brand, UPC, and description
- [ ] **SRCH-02**: Filter by CPG category
- [ ] **SRCH-03**: Filter by brand
- [ ] **SRCH-04**: Sort by Featured, Newest, Price (low/high), Discount %, Units available

### Listing Detail

- [ ] **LIST-01**: Listing page displays product images, description, UPC, size, and case pack
- [ ] **LIST-02**: Listing page displays expiration date (if applicable), MSRP, listing price, and % off MSRP
- [ ] **LIST-03**: Listing page displays available quantity

### Order Builder & Purchase

- [ ] **ORDR-01**: BrandListing page presents table of all available InventorySKUs
- [ ] **ORDR-02**: Retailer can select SKUs and specify quantity per SKU
- [ ] **ORDR-03**: Running order summary updates in real time showing per-SKU totals and grand total
- [ ] **ORDR-04**: Retailer can Buy Now at listing price, flowing to order confirmation
- [ ] **ORDR-05**: Retailer can Make an Offer, submitting selected SKUs and proposed prices into negotiation

### Offer & Negotiation

- [ ] **OFFR-01**: Retailer submits offer with quantity and proposed unit price per selected SKU
- [ ] **OFFR-02**: System automatically adds the manufacturer's company-specific AIS margin (default 10%) to Retailer's offer before presenting to Manufacturer
- [ ] **OFFR-03**: Manufacturer can accept, decline, or counter an offer
- [ ] **OFFR-04**: System strips the manufacturer's company-specific AIS margin from Manufacturer's counteroffer before presenting to Retailer
- [ ] **OFFR-05**: Negotiation supports multiple rounds of counter/response until accepted or declined
- [ ] **OFFR-06**: Accepted offer automatically converts to a confirmed order

### Manufacturer Portal

- [ ] **MFPR-01**: Manufacturer can view their own inventory listings and status (active, sold, pending)
- [ ] **MFPR-02**: Manufacturer can receive, view, accept, decline, and counter offers from their portal

### Admin Management

- [ ] **ADMN-01**: Admin can create, edit, and delete inventory listings
- [ ] **ADMN-02**: Admin can manage brands and categories
- [ ] **ADMN-03**: Admin can view all offers, counteroffers, and their statuses in a read-only dashboard
- [ ] **ADMN-04**: Admin can view and manage registered users and their roles
- [ ] **ADMN-05**: Admin can set a custom AIS margin percentage per company (defaults to 10%)

### Notifications

- [ ] **NOTF-01**: In-app notifications are delivered for all transaction events (offer received, accepted, declined, countered, order confirmed)
- [ ] **NOTF-02**: In-app notifications are always on and cannot be disabled

### Export

- [ ] **EXPT-01**: Retailer can export inventory details as XLS spreadsheet
- [ ] **EXPT-02**: Export includes: Product Description, UPC, Size, Case Pack, Expiration, Price, Qty, Total

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Catalog Enhancements

- **CATL-05**: Hero/featured listing section on shop page (admin-curated)
- **CATL-06**: Negotiation potential indicator (Low/Medium/High) displayed on listings
- **CATL-07**: Geographic restrictions, retail restrictions, and FOB/Ship From location displayed on listings

### Notifications & Email

- **NOTF-03**: Email notifications via Resend for transaction events (offer received, accepted, declined, countered, order confirmed)
- **NOTF-04**: Users can toggle email notifications on/off per event type
- **NOTF-05**: Notification preferences saved to profile and respected by Resend dispatch layer

### Export Enhancements

- **EXPT-03**: Export inventory details as PDF

### Manufacturer Features

- **MFPR-03**: Manufacturer can view completed orders and transaction history
- **MFPR-04**: Manufacturer self-serve inventory upload (CSV/XLS bulk upload and manual entry)

### Company & Teams

- **AUTH-08**: Multiple users per company with shared visibility into company offers/orders
- **AUTH-09**: Company-level roles (owner, member, viewer) via Clerk Organizations
- **AUTH-10**: Team management UI (invite users, assign company roles)

### Admin Communications

- **ADMN-06**: Marketing bulletins — create and publish announcements visible to all users or filtered by role
- **ADMN-07**: Email blast tool — compose and send emails to all users or segmented by role

### Campaigns

- **CAMP-01**: Admin can create and publish retail campaigns (modeled after RangeMe)
- **CAMP-02**: Campaign fields: retailer/buyer name, description, category focus, deadline, available tiers
- **CAMP-03**: Manufacturers can apply or unlock access to campaigns

### CMS Integration

- **CMS-01**: Migrate editorial content (brand descriptions, marketing copy, campaign content) to Sanity CMS
- **CMS-02**: Sanity Studio provides content editing UI for non-technical admin staff

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Persistent cross-listing cart | Order Builder scoped per BrandListing; cross-listing state adds complexity with no Phase 1 benefit |
| Real-time buyer-seller chat | Direct communication bypasses AIS intermediary model and undermines revenue model |
| Auction/bidding system | Conflicts with margin-controlled intermediary model; commoditizes inventory and destroys brand value |
| Payment processing (Stripe/Dwolla) | PCI compliance premature for demo; AIS processes payments offline in early stage |
| Shipment tracking integration | AIS coordinates logistics offline in MVP; API integration when volume warrants |
| OMS/ERP integration (Ordoro, NetSuite) | Data model must stabilize; enterprise buyers don't exist yet |
| Net terms / trade credit | Requires underwriting capability AIS doesn't have in Phase 1 |
| OAuth/SSO (SAML/LDAP) | Clerk for MVP; Auth0 migration path if enterprise SSO needed |
| AI-powered matching/recommendations | No transaction data to train on yet; manual curation in early phases |
| Mobile native app | Responsive web covers mobile; user base too small to justify native |
| Video in listings | Storage/bandwidth costs disproportionate; CPG buyers care about specs not video |
| Contentful CMS | Free tier prohibits commercial use ($300/mo Lite). PostgreSQL for Phase 1; Sanity (free, commercial OK) for Phase 2+ |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| AUTH-07 | Phase 1 | Complete |
| ADMN-01 | Phase 2 | Pending |
| ADMN-02 | Phase 2 | Pending |
| CATL-01 | Phase 3 | Pending |
| CATL-02 | Phase 3 | Pending |
| CATL-03 | Phase 3 | Pending |
| CATL-04 | Phase 3 | Pending |
| SRCH-01 | Phase 3 | Pending |
| SRCH-02 | Phase 3 | Pending |
| SRCH-03 | Phase 3 | Pending |
| SRCH-04 | Phase 3 | Pending |
| LIST-01 | Phase 3 | Pending |
| LIST-02 | Phase 3 | Pending |
| LIST-03 | Phase 3 | Pending |
| ORDR-01 | Phase 4 | Pending |
| ORDR-02 | Phase 4 | Pending |
| ORDR-03 | Phase 4 | Pending |
| ORDR-04 | Phase 4 | Pending |
| ORDR-05 | Phase 4 | Pending |
| OFFR-01 | Phase 5 | Pending |
| OFFR-02 | Phase 5 | Pending |
| OFFR-03 | Phase 5 | Pending |
| OFFR-04 | Phase 5 | Pending |
| OFFR-05 | Phase 5 | Pending |
| OFFR-06 | Phase 5 | Pending |
| NOTF-01 | Phase 5 | Pending |
| NOTF-02 | Phase 5 | Pending |
| MFPR-01 | Phase 6 | Pending |
| MFPR-02 | Phase 6 | Pending |
| ADMN-03 | Phase 6 | Pending |
| ADMN-04 | Phase 6 | Pending |
| ADMN-05 | Phase 6 | Pending |
| EXPT-01 | Phase 6 | Pending |
| EXPT-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after roadmap creation*
