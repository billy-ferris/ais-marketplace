# Phase 1: Foundation and Auth - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Monorepo scaffolding with Turborepo, PostgreSQL schema with Drizzle ORM, Clerk authentication with three-role RBAC (Admin, Manufacturer, Retailer), and companies as first-class entities. Phase 1 delivers the foundation — all users and companies are seeded via script. No invite UI, no company management UI, no catalog or storefront.

</domain>

<decisions>
## Implementation Decisions

### Monorepo scaffolding
- Turborepo with pnpm as the package manager
- Structure: `apps/web` (React + Vite frontend), `apps/api` (Express + Node backend), `packages/shared` (shared code)
- Shared package scoped as `@ais/shared`
- Shared package contains: TypeScript types/interfaces, Zod validation schemas, constants/enums, API contract helpers (route paths, response wrappers, error shapes)

### Registration model
- Invite-only platform — no self-registration. Admin creates companies and invites users
- Phase 1: All users and companies are seeded via script (seed first Admin via Clerk API + database)
- Invite flow UI deferred to Phase 6 (alongside ADMN-04 user management)
- Unauthenticated visitors see a branded login-only page with AIS logo, tagline, and "Contact us for access" message — no signup button
- Future state: landing page with contact/request access form (not Phase 1)

### Invite flow design (for Phase 6)
- Admin provides: email, role, and company when inviting a user
- Invited user clicks link, sets password, and is immediately in — admin pre-fills all other details
- Admin creates company first, then invites users to it

### Post-login experience
- Role-based dashboard shells — each role gets its own dashboard page
- Shared app shell with collapsible sidebar navigation
- Sidebar: AIS logo at top, role-specific nav items, user/company info at bottom
- Nav items change based on role (Admin: Manage, Users; Manufacturer: Inventory, Offers; Retailer: Shop, Orders)
- Dashboard sections show "Coming Soon" cards with feature name, brief description, and badge for features not yet built

### Company entity
- Admin creates company before inviting users (company exists independently)
- Required fields: company name, type (manufacturer/retailer), AIS margin percentage (default 10%), contact name, phone
- Structured address fields: street, city, state, zip
- Company creation UI deferred to Phase 6; companies seeded in Phase 1
- Users belong to a company via foreign key (one user per company in Phase 1, schema supports multiple)

### Demo seed data
- 3-5 companies: 1 AIS admin company, 2-3 manufacturer companies, 1-2 retailer companies
- Realistic fictional CPG company names (e.g., "Luxe Beauty Co.", "FreshGlow Skincare", "Metro Retail Group")
- Shared demo password across all seed accounts for easy role-switching during demos
- Varied margin percentages across manufacturer companies (e.g., 8%, 10%, 12%) to demonstrate per-company margin feature
- One user per company in seed data

### Claude's Discretion
- Exact Turborepo pipeline configuration (build, dev, lint tasks)
- Drizzle ORM migration strategy and schema file organization
- Clerk webhook setup for syncing user data
- Sidebar component implementation (shadcn/ui sidebar or custom)
- Dashboard card design and layout
- Specific seed company names, emails, and margin values
- Error page designs (404, 403, 500)

</decisions>

<specifics>
## Specific Ideas

- Login-only page for now — future landing page with signup/contact form is out of scope for Phase 1
- Invite-only model driven by B2B nature: negotiated margins per company, vetting participants, preventing unwanted usage
- "Set password and go" invite experience — minimal friction since admin already vetted the user
- Address fields included on company entity now for future FOB/ship-from location needs

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing codebase — greenfield project

### Established Patterns
- No existing patterns — Phase 1 establishes all foundational patterns

### Integration Points
- Clerk auth SDK integrates with both apps/web (React SDK) and apps/api (Express middleware)
- @ais/shared package is the bridge between frontend and backend for types and validation
- PostgreSQL via Drizzle ORM provides the data layer for both apps

</code_context>

<deferred>
## Deferred Ideas

- Landing page with request access / contact form — future enhancement to the login-only page
- Invite flow UI — Phase 6 alongside ADMN-04 user management
- Company CRUD UI — Phase 6 alongside user management
- Logo upload for companies — more relevant for manufacturer brand pages in Phase 3

</deferred>

---

*Phase: 01-foundation-and-auth*
*Context gathered: 2026-03-08*
