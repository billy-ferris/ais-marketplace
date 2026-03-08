# Feature Research

**Domain:** B2B CPG Excess Inventory / Closeout Marketplace
**Researched:** 2026-03-08
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Product catalog with brand/category browsing** | Every competitor (Highstock, BULQ, B-Stock, Ghost) has structured catalog browsing. Buyers need to discover inventory by brand and category. | MEDIUM | Hybrid Contentful (brand/product content) + PostgreSQL (transactional data) adds complexity. CPG categories (Beauty Tools, Fragrances, Hair Care, etc.) must be first-class navigation elements. |
| **Full-text search with UPC lookup** | B2B CPG buyers search by UPC/GTIN, product name, and brand name. BULQ and B-Stock both offer UPC-level search. Retailers often know exactly which SKU they want. | MEDIUM | Must index across Contentful product fields (name, UPC, description) and PostgreSQL (availability, price). UPC search is non-negotiable in CPG -- retailers reference UPCs in their own systems. |
| **Category and attribute filtering with sort** | BULQ, Highstock, Liquidation.com, and B-Stock all offer faceted filtering. B2B buyers with limited time need to narrow results quickly. | MEDIUM | Filters: category, brand, price range, discount %, units available, inventory type (closeout/discontinued/short-dated/excess). Sort: featured, newest, price asc/desc, discount %, units available. |
| **Detailed listing pages** | BULQ provides full manifests per lot. Highstock shows enriched product catalogs. Buyers need complete information to make purchase decisions without seeing product in person. | LOW | Must include: product images, brand, UPC, size/weight, description, case pack, available quantity, unit price, total value, discount vs MSRP, expiration/date code (if applicable), FOB location, restrictions, and negotiation indicator. |
| **Buy Now (fixed-price purchase)** | BULQ operates entirely on fixed-price. Direct Liquidation and B-Stock use auctions. Fixed-price is simpler and expected as a baseline purchasing path in non-auction marketplaces. | LOW | Listing price includes AIS 10% margin. Straightforward order creation. |
| **Offer/negotiation flow** | Highstock, Ghost, and Faire all support offer-based purchasing. Price negotiation is standard in B2B wholesale and especially in closeout/liquidation where pricing is fluid. | HIGH | AIS-specific: margin-transparent negotiation where AIS adds 10% to Retailer offers before showing to Manufacturer, and strips margin from counters before showing to Retailer. Multi-round accept/counter/decline loop. This is the core differentiating business logic. |
| **Role-based access (Admin, Manufacturer, Retailer)** | Every B2B marketplace segments experiences by role. RangeMe has buyer/supplier views. B-Stock has seller/buyer portals. Ghost is members-only with role-specific dashboards. | MEDIUM | Three roles via Clerk RBAC. Admin manages listings + observes offers. Manufacturer manages their inventory + negotiates offers. Retailer browses + buys + makes offers. |
| **User registration with verification** | B-Stock requires resale certificates. Highstock and Ghost are members-only with vetting. BULQ requires business verification. Unvetted marketplaces lose trust fast. | MEDIUM | Clerk handles auth mechanics. Business verification (company name, resale certificate) needed for Retailers. Manufacturer onboarding is admin-facilitated in Phase 1. Verification builds trust that AIS is a professional intermediary. |
| **Manufacturer portal (inventory + offers)** | Highstock sellers manage offers, view inventory status, accept/decline/counter. Ghost sellers list inventory with built-in controls. Every two-sided marketplace needs a seller-side dashboard. | MEDIUM | View own inventory listings and status, receive offer notifications, accept/decline/counter offers, see order history. Read-only in Phase 1 (Admin creates listings); self-serve upload in Phase 2. |
| **Notification system (in-app + email)** | BULQ, B-Stock, and Highstock all notify on transaction events. B2B transactions are time-sensitive (short-dated inventory, competitive offers). Missing a notification = lost deal. | MEDIUM | In-app notifications always on. Email via Resend toggleable per user preference. Events: new inventory matching criteria, offer received, offer accepted/countered/declined, order confirmed, order status changes. |
| **Order confirmation and tracking** | Every e-commerce platform, B2B or B2C, confirms orders. Buyers need receipts and status visibility. | LOW | Order confirmation with summary (items, quantities, prices, total, FOB, estimated timeline). Order status tracking (pending, confirmed, processing, shipped, delivered). Logistics coordinated offline by AIS in Phase 1. |
| **Responsive web design** | 60% of B2B buyers use mobile devices for purchases (Shopify 2025 data). Highstock and Ghost are web-first with responsive design. Mobile-friendly is baseline expectation. | LOW | Tailwind + shadcn/ui handles responsiveness well. Web-first, no native app needed. Ensure Order Builder and offer flows work on tablet/phone. |
| **Admin inventory management** | AIS is the intermediary -- Admin must be able to create, edit, delete, and manage all listings. This is the operational backbone. | MEDIUM | Create/edit/delete listings in Contentful (product content) + PostgreSQL (transactional fields). Set negotiation potential flag, restrictions, FOB location. Manage brand and category taxonomy. |
| **Export capabilities (XLS, PDF)** | OrderCircle, JOOR, and other B2B platforms all offer export. Buyers need data for their own procurement systems. Sellers need reports for accounting. | LOW | Export inventory details, order summaries, and offer history as XLS and PDF. Standard for any B2B platform with procurement workflows. |

### Differentiators (Competitive Advantage)

Features that set AIS apart. Not required by day one, but create defensible value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Margin-transparent intermediary model** | Unlike Highstock (brand-to-buyer direct) or B-Stock (auction), AIS acts as trusted intermediary with transparent 10% fee. Manufacturers never see Retailer's raw price; Retailers never see Manufacturer's raw price. This protects both sides and justifies AIS's role. | HIGH | Core business logic baked into offer negotiation. Must be bulletproof -- margin math errors destroy trust. Every offer/counter passes through margin transformation layer. This is AIS's primary structural differentiator vs. direct marketplaces. |
| **CPG vertical focus (Beauty/Personal Care)** | Highstock is beauty-focused but targets international liquidation. Ghost is apparel/footwear-heavy. Spoiler Alert is food/beverage. No dominant player owns CPG beauty/personal care closeouts for domestic US retail. | LOW | Not a feature to build -- it's a positioning decision. But the catalog, categories, and product fields should be CPG-optimized (UPC, case pack, date codes, beauty-specific attributes like shade/size). |
| **Brand-level browsing with editorial content** | RangeMe excels at brand presentation with rich profiles. Highstock generates visual catalogs. Most liquidation sites (BULQ, Liquidation.com) are utilitarian. Rich brand pages with marketing copy and imagery create a premium discovery experience that attracts quality manufacturers. | MEDIUM | Contentful powers brand descriptions, marketing copy, and imagery. Brand pages become "storefronts" within the marketplace. This signals to manufacturers that their brand will be presented professionally, not dumped into a liquidation bin. |
| **Retail campaigns (RangeMe-style)** | RangeMe's retail campaigns let buyers discover curated product collections. No liquidation marketplace does this. Curated campaigns ("Spring Beauty Closeouts", "Short-Dated Skincare Deals") create urgency and discovery beyond passive browsing. | MEDIUM | Phase 2 feature. Content-driven via Contentful. Campaigns aggregate listings around themes, seasons, or promotional events. Email blast tool to notify Retailers of new campaigns. |
| **Admin-curated featured sections** | Highstock and Ghost use algorithmic matching. A human-curated "Featured" section on the shop page lets AIS editorially highlight high-value deals, creating a boutique marketplace feel. | LOW | Hero section + featured listings on main shop page. Admin selects which listings to feature. Low complexity, high impact on perceived curation quality. |
| **Marketing bulletins** | No liquidation marketplace sends editorial content about market conditions, trends, or buying opportunities. This positions AIS as a thought leader and keeps users engaged between transactions. | LOW | Phase 2 feature. Contentful-managed content. Email distribution via Resend. Builds relationship beyond transactional interactions. |
| **Inventory alert / saved search notifications** | B-Stock offers saved searches and watchlists. BULQ has seller subscription emails for "Just Listed" and "Closing Soon." Proactive notifications when new inventory matches a Retailer's interests drive repeat engagement. | MEDIUM | Phase 2/3 feature. Retailers define criteria (categories, brands, price ranges). System notifies when matching inventory is listed. Transforms passive browsing into active matchmaking. |
| **Restriction enforcement** | Highstock enforces geographic and channel restrictions contractually. Ghost controls which distribution channels see inventory. AIS can enforce manufacturer-specified restrictions (geographic, channel, minimum order) at the platform level, not just contractually. | LOW | Restrictions displayed on listings. System can hide restricted listings from ineligible Retailers. Builds manufacturer trust that their brand is protected. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for AIS specifically.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Auction/bidding system** | B-Stock, BoxFox, Liquidation.com, and Direct Liquidation all use auctions. Seems like industry standard. | Auctions create uncertainty for both sides, add significant complexity (bid management, timers, sniping prevention, reserve prices), and conflict with AIS's intermediary model where margin must be controlled. Auctions also favor the buyer and commoditize inventory -- bad for manufacturer relationships. | Fixed-price Buy Now + structured Make Offer negotiation. Gives manufacturers pricing control while allowing negotiation. AIS margin stays predictable. |
| **Persistent cross-listing cart** | Every B2C e-commerce site has a cart. Seems like table stakes. | AIS listings are brand-level with multiple SKUs. A cross-listing cart introduces complexity around mixed FOB locations, different manufacturers, split shipments, partial offer states, and margin calculations across multiple sellers. Massively increases order management complexity for Phase 1. | Order Builder scoped per BrandListing. Retailer selects SKUs and quantities within a single brand's listing, then checks out or makes offer. Simpler UX, simpler backend, simpler logistics. |
| **Real-time chat between buyer and seller** | Highstock has a conversational interface. Ghost and RangeMe have messaging. Seems like it enables faster negotiation. | AIS is the intermediary -- buyers and sellers should NOT communicate directly. Direct communication bypasses AIS's margin and undermines the intermediary model. Chat also requires WebSocket infrastructure, moderation, and creates support burden. | Structured offer/counter flow handles price negotiation. Any questions route through AIS (Admin) who mediates. In-app notifications keep both sides informed of offer status changes. |
| **Manufacturer self-serve inventory upload (Phase 1)** | Manufacturers want to list their own inventory. Highstock and Ghost let sellers upload directly. | In Phase 1, AIS needs to control listing quality, pricing, and data consistency. Manufacturer-uploaded data requires validation, moderation, duplicate detection, and image standards enforcement -- all significant complexity. | Admin manually enters listings in Phase 1. Manufacturer self-serve upload deferred to Phase 2 when validation workflows are proven. Keeps demo-quality high. |
| **Payment processing (Phase 1)** | Every marketplace needs payments. Stripe, Dwolla, Bill.com seem straightforward. | Phase 1 is demo-ready, not transaction-ready. Payment processing adds PCI compliance, escrow concerns, refund flows, tax calculation, net terms complexity, and regulatory requirements. Premature for a pitch deck demo. | Phase 3 feature. AIS processes payments offline in early stage. Platform captures order intent; AIS handles money movement, invoicing, and collections manually. |
| **Video in listings** | Rich media is trendy. Amazon and Shopify stores have video. | Storage/bandwidth costs are disproportionate for early-stage. CPG closeout buyers care about UPC, quantity, price, and expiration -- not product videos. Static images + detailed specs provide all needed information. | High-quality product images (multiple angles) + comprehensive text specs. Contentful handles image CDN well. |
| **AI-powered matching/recommendations** | Highstock has DealAI, InventoryAI, OfferAI. Ghost uses data engine for discovery. AI is hot. | Building recommendation engines requires transaction history data that does not exist yet. AI features without data are theater. Premature optimization that delays core platform launch. | Manual curation by Admin (featured listings, campaigns) in early phases. Collect transaction data. Evaluate AI matching when there is sufficient data to train on (Phase 3+). |
| **OMS/ERP integration (Phase 1)** | Enterprise buyers want integration with their procurement systems. Ordoro, NetSuite are standard. | Integration requires stable APIs, documented schemas, and real transaction volume to justify. Phase 1 is a demo. Integration work is wasted if the data model changes during validation. | Phase 3 feature. Export to XLS/PDF covers early data portability needs. Build API-first architecture so integrations are feasible later, but do not build connectors yet. |
| **Net terms / trade credit** | B2B standard. Faire offers net 60. Wholesale buyers expect payment terms. | Credit risk assessment, collections, cash flow management, and accounting complexity. Requires underwriting capability AIS does not have in Phase 1. | Phase 3 feature. Cash/check/wire payments processed offline by AIS initially. Net terms added when transaction volume justifies the credit infrastructure. |
| **Mobile native app** | Some B2B platforms (Alibaba, Faire) have native apps. Buyers are on mobile. | Maintaining iOS + Android + web triples development surface. Responsive web covers mobile use cases. User base is too small in early stage to justify native app investment. | Responsive web application. Tailwind + shadcn/ui provides excellent mobile experience. Reassess native app when mobile traffic data justifies it. |

## Feature Dependencies

```
[Clerk Auth + RBAC]
    |
    +--requires--> [User Registration & Verification]
    |                  |
    |                  +--enables--> [Manufacturer Portal]
    |                  |                 |
    |                  |                 +--enables--> [Offer Negotiation Flow]
    |                  |                                   |
    |                  |                                   +--requires--> [Margin Transformation Layer]
    |                  |                                   |
    |                  |                                   +--enables--> [Admin Offer Dashboard]
    |                  |
    |                  +--enables--> [Retailer Browse & Purchase]
    |
[Contentful CMS + PostgreSQL Schema]
    |
    +--requires--> [Brand/Product Content Model]
    |                  |
    |                  +--enables--> [Product Catalog Browsing]
    |                  |                 |
    |                  |                 +--enables--> [Search & Filtering]
    |                  |                 |
    |                  |                 +--enables--> [Listing Detail Pages]
    |                  |
    |                  +--enables--> [Admin Inventory Management]
    |
    +--requires--> [Inventory/Order/Offer Data Model]
                       |
                       +--enables--> [Order Builder (per BrandListing)]
                       |                 |
                       |                 +--enables--> [Buy Now Flow]
                       |                 |
                       |                 +--enables--> [Best Offer Flow]
                       |
                       +--enables--> [Order Confirmation & Tracking]
                       |
                       +--enables--> [Export (XLS/PDF)]

[Notification System]
    |
    +--requires--> [User Preferences Model]
    +--requires--> [Resend Email Integration]
    +--enhances--> [Offer Negotiation Flow] (real-time status updates)
    +--enhances--> [Order Tracking] (status change alerts)

[Brand Editorial Content] --enhances--> [Product Catalog Browsing]
[Featured Sections] --enhances--> [Product Catalog Browsing]
[Retail Campaigns] --requires--> [Brand Editorial Content]
[Marketing Bulletins] --requires--> [Resend Email Integration]
[Inventory Alerts] --requires--> [Notification System] + [Search & Filtering]

[Real-time Chat] --conflicts--> [Intermediary Margin Model]
    (direct buyer-seller communication bypasses AIS)

[Persistent Cart] --conflicts--> [Per-BrandListing Order Builder]
    (cross-listing state contradicts scoped ordering model)
```

### Dependency Notes

- **Offer Negotiation requires Margin Transformation Layer:** The 10% AIS margin add/strip on offers and counters is the core business logic. Without it, AIS has no revenue model. This must be built first and tested exhaustively.
- **Product Catalog requires both Contentful and PostgreSQL:** The hybrid data architecture means catalog pages hydrate from two sources. Content model must be designed before any browsing features can work.
- **Notification System enhances Offer Flow:** Negotiation without notifications is broken -- Manufacturers will not check the portal on a polling basis. Email notifications for offer events are effectively required, not optional.
- **Search & Filtering requires indexed data:** Full-text search across hybrid data sources (Contentful product fields + PostgreSQL transactional fields) needs a considered indexing strategy. This blocks the browsing experience.
- **Retail Campaigns require Brand Editorial Content:** Campaigns are curated collections of brand content. The content model and brand pages must exist first.
- **Real-time Chat conflicts with Intermediary Model:** If buyers and sellers can communicate directly, they can negotiate off-platform and cut AIS out. Structured offer/counter flow is the communication channel by design.

## MVP Definition

### Launch With (v1 -- Demo-Ready)

Minimum viable product to pitch manufacturers and retailers with sample data.

- [ ] **Clerk auth with three-role RBAC** -- gatekeeper for all role-specific experiences
- [ ] **Contentful brand/product content model** -- foundation for all catalog browsing
- [ ] **PostgreSQL inventory/order/offer schema** -- foundation for all transactional features
- [ ] **Main shop page with hero, featured, and brand/category browsing** -- the storefront
- [ ] **Full-text search across product name, brand, UPC, description** -- core discovery mechanism
- [ ] **Category and brand filtering with sort options** -- essential narrowing for CPG catalog
- [ ] **Listing detail pages with all product fields** -- the product page
- [ ] **Order Builder (per-BrandListing)** -- SKU selection with quantity and real-time summary
- [ ] **Buy Now flow** -- immediate purchase at listing price with order confirmation
- [ ] **Best Offer flow with margin transformation** -- the AIS business model in code
- [ ] **Manufacturer portal** -- view inventory, receive/manage offers
- [ ] **Admin inventory management** -- create/edit/delete listings, set negotiation flags
- [ ] **Admin offer visibility dashboard** -- read-only view of all offers
- [ ] **In-app notifications** -- always-on transaction event alerts
- [ ] **Email notifications via Resend** -- toggleable per user preference
- [ ] **Export inventory as XLS and PDF** -- data portability

### Add After Validation (v1.x -- Phase 2)

Features to add once core is working and real manufacturers/retailers are onboarded.

- [ ] **Manufacturer self-serve inventory upload** -- triggered when Admin bottleneck slows listing velocity
- [ ] **Retail campaigns (RangeMe-style)** -- triggered when catalog has enough brands to curate thematically
- [ ] **Marketing bulletins** -- triggered when there is a Retailer audience worth emailing
- [ ] **Admin email blast tool** -- triggered alongside marketing bulletins
- [ ] **Inventory alert / saved search notifications** -- triggered when Retailers request proactive matching
- [ ] **Enhanced restriction enforcement** -- triggered when manufacturers request programmatic channel/geo controls

### Future Consideration (v2+ -- Phase 3)

Features to defer until real transaction volume exists.

- [ ] **Payment processing (Stripe/Dwolla/Bill.com)** -- defer until AIS processes enough orders to justify PCI compliance and payment infrastructure
- [ ] **Shipment tracking integration** -- defer until logistics volume warrants API integration vs. manual coordination
- [ ] **OMS/ERP integration (Ordoro, NetSuite)** -- defer until data model is stable and enterprise buyers demand it
- [ ] **Net terms / trade credit** -- defer until AIS has cash flow and credit assessment capability
- [ ] **OAuth/SSO (SAML/LDAP)** -- defer until enterprise manufacturer onboarding requires it
- [ ] **AI-powered matching/recommendations** -- defer until sufficient transaction data exists to train models
- [ ] **Native mobile app** -- defer until mobile traffic data justifies the investment

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Product catalog with brand/category browsing | HIGH | MEDIUM | P1 |
| Full-text search with UPC lookup | HIGH | MEDIUM | P1 |
| Category/brand filtering with sort | HIGH | MEDIUM | P1 |
| Detailed listing pages | HIGH | LOW | P1 |
| Buy Now flow | HIGH | LOW | P1 |
| Offer/negotiation with margin logic | HIGH | HIGH | P1 |
| Three-role RBAC (Clerk) | HIGH | MEDIUM | P1 |
| User registration with verification | HIGH | MEDIUM | P1 |
| Manufacturer portal | HIGH | MEDIUM | P1 |
| In-app + email notifications | HIGH | MEDIUM | P1 |
| Order confirmation and tracking | HIGH | LOW | P1 |
| Admin inventory management | HIGH | MEDIUM | P1 |
| Admin offer dashboard | MEDIUM | LOW | P1 |
| Export (XLS/PDF) | MEDIUM | LOW | P1 |
| Responsive web design | HIGH | LOW | P1 |
| Brand editorial content (Contentful) | MEDIUM | MEDIUM | P1 |
| Featured/hero sections | MEDIUM | LOW | P1 |
| Manufacturer self-serve upload | HIGH | HIGH | P2 |
| Retail campaigns | MEDIUM | MEDIUM | P2 |
| Marketing bulletins | MEDIUM | LOW | P2 |
| Admin email blast | MEDIUM | LOW | P2 |
| Inventory alerts / saved searches | MEDIUM | MEDIUM | P2 |
| Restriction enforcement (programmatic) | MEDIUM | LOW | P2 |
| Payment processing | HIGH | HIGH | P3 |
| Shipment tracking | MEDIUM | MEDIUM | P3 |
| OMS/ERP integration | LOW | HIGH | P3 |
| Net terms / trade credit | MEDIUM | HIGH | P3 |
| AI matching/recommendations | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for demo launch (Phase 1)
- P2: Should have, add when real users are onboarded (Phase 2)
- P3: Nice to have, future consideration when transaction volume justifies (Phase 3)

## Competitor Feature Analysis

| Feature | Highstock | Ghost | BULQ | B-Stock | Spoiler Alert | BoxFox | AIS Approach |
|---------|-----------|-------|------|---------|---------------|--------|--------------|
| **Purchase model** | Offer/bid | Negotiated | Fixed price | Auction | Negotiated | Auction | Fixed price + Make Offer |
| **Intermediary role** | Platform facilitates; brand controls | Members-only marketplace | Direct from platform | Retailer-branded auctions | SaaS for CPGs | Platform facilitates | AIS as active intermediary with margin |
| **Brand protection** | Geographic/channel restrictions, buyer vetting | Members-only, channel controls | N/A (pallets/lots) | Branded storefronts | Seller-controlled | Verified retailers | Restriction display, admin-managed access |
| **Product focus** | Beauty/personal care | Apparel/footwear/beauty/home | Mixed retail returns | Mixed retail returns/overstock | Food/beverage CPG | Mixed retail surplus | CPG beauty/personal care |
| **Catalog quality** | AI-enriched visual catalogs | Curated listings | Full manifests per lot | Detailed with manifests | Data-driven listings | UPC-verified with photos | Contentful editorial + structured data |
| **User vetting** | Vetted buyers, brand approval | Members-only | Business registration | Resale certificate | Enterprise CPGs | Authorized retailers only | Clerk auth + business verification |
| **Notifications** | Offer updates | Transaction alerts | Listing alerts | Bid/auction alerts | Workflow notifications | Bid notifications | In-app + email (Resend) for all events |
| **Analytics** | DealAI offer analysis | Data engine insights | Purchase dashboards | Bid history/performance | Performance metrics | Profit calculators | Admin dashboard, order/offer history, exports |
| **Logistics** | Full service (customs, freight) | Integrated | Platform-managed shipping | Regional filtering | Partner coordination | Buyer-arranged | AIS coordinates offline (Phase 1) |
| **Payment terms** | Same-day to sellers, terms to buyers | Platform-managed | Pay on purchase | Pay on win | Enterprise invoicing | Escrow | Offline (Phase 1), Stripe/Dwolla (Phase 3) |
| **AI features** | DealAI, InventoryAI, OfferAI, ResearchAI, ComplianceAI | Data engine matching | None | None | Pricing intelligence | None | None (Phase 1); data-driven later |
| **Mobile** | Responsive web | Responsive web | Responsive web | Responsive web | Enterprise web app | iOS app + web | Responsive web (Tailwind + shadcn/ui) |

### Competitive Positioning Notes

1. **Highstock is the closest competitor** in terms of product focus (beauty/CPG) and model (intermediary with margin). Key differences: Highstock targets international liquidation, uses AI heavily, and charges 10% commission. AIS targets domestic US retail and uses human intermediation. Highstock raised $5.5M (Greylock-backed).

2. **Ghost is the market leader** in B2B surplus but focuses on apparel/footwear with some beauty. Members-only, $95M total funding. Their scale and data engine are not replicable at AIS's stage. AIS wins on CPG specificity and personal intermediation.

3. **Spoiler Alert is the CPG-closest analog** but focuses on food/beverage and operates as SaaS for enterprise CPGs (Kraft Heinz, Nestle, Campbell's), not as a marketplace. AIS serves mid-market CPG manufacturers who cannot afford Spoiler Alert's enterprise pricing.

4. **BULQ/B-Stock/Direct Liquidation** are liquidation commodity platforms (pallets, mixed lots, auctions). They destroy brand value. AIS's editorial catalog approach and brand-level browsing are the opposite -- protecting brand perception while enabling closeout sales.

5. **RangeMe is the UX reference** for brand discovery and presentation but is not a closeout marketplace. Its retail campaign model and brand profile pages are worth emulating for AIS's Phase 2 features.

## Sources

- [Highstock - Beauty Independent](https://www.beautyindependent.com/highstock-beauty-brands-surplus-inventory/) -- platform features, pricing model, brand protection
- [Highstock - BeautyMatter](https://beautymatter.com/articles/highstock-turns-overstock-into-opportunity) -- AI features, buyer/seller experience
- [Introducing Highstock - Greylock](https://greylock.com/portfolio-news/introducing-highstock/) -- market positioning, "Bloomberg terminal for unsold inventory"
- [Highstock Sellers](https://www.highstock.com/sellers) -- DealAI, InventoryAI, seller workflow
- [Highstock Buyers](https://www.highstock.com/buyers) -- OfferAI, ResearchAI, ComplianceAI, buyer experience
- [Ghost - Retail Dive](https://www.retaildive.com/news/ghost-raises-30m-series-B-inventory-surplus/691481/) -- Ghost funding, feature overview
- [Ghost - PYMNTS](https://www.pymnts.com/news/retail/2024/ghost-raises-40-million-to-expand-b2b-marketplace-for-surplus-inventory/) -- Ghost Series C, scale
- [BULQ - Closeout Explosion](https://closeoutexplosion.com/how-bulq-com-makes-buying-liquidated-inventory-simple/) -- fixed-price model, manifests, transparency
- [B-Stock](https://bstock.com/) -- auction model, private branded marketplaces
- [B-Stock How It Works](https://bstock.com/how-it-works/) -- buyer experience, seller features
- [BoxFox](https://boxfox.co/) -- auction model, 5% fee, UPC verification
- [Spoiler Alert](https://www.spoileralert.com/) -- CPG surplus platform, Kraft Heinz partnership
- [RangeMe](https://www.rangeme.com/) -- brand discovery, retail campaigns, direct purchasing
- [RangeMe - Progressive Grocer](https://progressivegrocer.com/rangeme-adds-direct-purchasing-product-discovery-platform) -- direct purchasing feature
- [Excess2Sell](https://www.excess2sell.com/cms/about) -- confidentiality model, anonymous trading
- [B2B Marketplace Features - Rigby](https://www.rigbyjs.com/blog/b2b-marketplace-features) -- essential B2B marketplace features 2026
- [B2B Marketplace Models - JourneyH](https://www.journeyh.io/blog/b2b-marketplace-models-features) -- marketplace model types, negotiation features
- [B2B Mobile Commerce - Shopify](https://www.shopify.com/enterprise/blog/b2b-mobile-commerce) -- 60% mobile B2B buyers stat
- [B-Stock Browsing Guide](https://bstock.com/blog/getting-started-how-to-browse-listings/) -- saved searches, watchlists, seller subscriptions
- [Inventory Notifications - Knock](https://knock.app/blog/how-to-inventory-notifications-marketplace) -- marketplace notification patterns
- [Marketplace KYC - AIPrise](https://www.aiprise.com/blog/marketplace-seller-onboarding-kyc-best-practices-and-tips) -- seller onboarding verification
- [B2B Marketplace Trends 2025 - Swell](https://www.swell.is/content/b2b-marketplace-trends-shaping) -- 750+ vertical marketplaces, industry trends

---
*Feature research for: B2B CPG Excess Inventory / Closeout Marketplace*
*Researched: 2026-03-08*
