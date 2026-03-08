# Phase 1: Foundation and Auth - Research

**Researched:** 2026-03-08
**Domain:** Monorepo scaffolding, PostgreSQL/Drizzle ORM, Clerk authentication, RBAC, company entities
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire project foundation: a Turborepo + pnpm monorepo with three workspaces (`apps/web`, `apps/api`, `packages/shared`), PostgreSQL via Drizzle ORM for the data layer, and Clerk for authentication with custom publicMetadata-based RBAC (Admin, Manufacturer, Retailer). Companies are first-class entities with a margin percentage field. All users and companies are seeded via script -- no registration UI beyond the Clerk-hosted sign-in component, and no invite flow (deferred to Phase 6).

The Clerk ecosystem just released Core 3 (2026-03-03), which renames `@clerk/clerk-react` to `@clerk/react` and replaces `<SignedIn>`/`<SignedOut>`/`<Protect>` with a unified `<Show>` component. Since this is a greenfield project, we should use Core 3 from day one. The `@clerk/express` package (v2.0.1) provides `clerkMiddleware()`, `requireAuth()`, and `getAuth()` for the backend. For Drizzle ORM, the stable release is v0.45.1 (not the v1.0.0-beta which is explicitly unstable). The new Relations v2 API (`defineRelations()`) is available in 0.45.x and should be used for type-safe relational queries.

**Primary recommendation:** Use the latest stable packages (Turborepo 2.x, Drizzle ORM 0.45.x, @clerk/react 5.x Core 3, @clerk/express 2.x), store user roles in Clerk publicMetadata exposed via custom session token claims, and sync Clerk users to PostgreSQL via webhook for the users table (needed because the marketplace requires cross-user data like company associations).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Turborepo with pnpm as the package manager
- Structure: `apps/web` (React + Vite frontend), `apps/api` (Express + Node backend), `packages/shared` (shared code)
- Shared package scoped as `@ais/shared`
- Shared package contains: TypeScript types/interfaces, Zod validation schemas, constants/enums, API contract helpers (route paths, response wrappers, error shapes)
- Invite-only platform -- no self-registration. Admin creates companies and invites users
- Phase 1: All users and companies are seeded via script (seed first Admin via Clerk API + database)
- Unauthenticated visitors see a branded login-only page with AIS logo, tagline, and "Contact us for access" message -- no signup button
- Role-based dashboard shells -- each role gets its own dashboard page
- Shared app shell with collapsible sidebar navigation
- Sidebar: AIS logo at top, role-specific nav items, user/company info at bottom
- Dashboard sections show "Coming Soon" cards with feature name, brief description, and badge
- Company entity: name, type (manufacturer/retailer), AIS margin percentage (default 10%), contact name, phone, structured address (street, city, state, zip)
- 3-5 companies seeded: 1 AIS admin company, 2-3 manufacturer companies, 1-2 retailer companies
- Realistic fictional CPG company names, shared demo password, varied margin percentages

### Claude's Discretion
- Exact Turborepo pipeline configuration (build, dev, lint tasks)
- Drizzle ORM migration strategy and schema file organization
- Clerk webhook setup for syncing user data
- Sidebar component implementation (shadcn/ui sidebar or custom)
- Dashboard card design and layout
- Specific seed company names, emails, and margin values
- Error page designs (404, 403, 500)

### Deferred Ideas (OUT OF SCOPE)
- Landing page with request access / contact form -- future enhancement
- Invite flow UI -- Phase 6 alongside ADMN-04 user management
- Company CRUD UI -- Phase 6 alongside user management
- Logo upload for companies -- Phase 3 brand pages
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can create account with email and password via Clerk | Clerk Backend SDK `createUser()` for seeding; Clerk-hosted `<SignIn>` component for login. Since invite-only, "account creation" happens via seed script calling Clerk API. |
| AUTH-02 | User receives email verification after signup | Clerk `createUser()` API auto-marks email as verified. Clerk dashboard controls verification flow settings. |
| AUTH-03 | User session persists across browser refresh | Clerk `<ClerkProvider>` handles session persistence via cookies/JWT automatically. No custom session code needed. |
| AUTH-04 | Users are assigned one of three roles: Admin, Manufacturer, or Retailer | Roles stored in Clerk `publicMetadata.role`, exposed via custom session token claims. TypeScript enum in `@ais/shared`. |
| AUTH-05 | Role-based access control enforces permission boundaries between roles | Express `requireAuth()` + custom middleware reading `sessionClaims.metadata.role`. React-side `<Show>` with condition callbacks. |
| AUTH-06 | Companies are first-class entities with company name, contact name, phone, type, and margin percentage (default 10%) | Drizzle `pgTable` with `pgEnum` for company type, `numeric` for margin, identity column PK. Structured address fields. |
| AUTH-07 | Users belong to a company via foreign key. Phase 1 supports one user per company; schema supports multiple. | Drizzle foreign key from `users.companyId` to `companies.id`. Webhook syncs Clerk user to local `users` table with `clerkId` column. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| turbo | ^2.8 | Monorepo build orchestration | Official Vercel tool, caching, task dependencies, pnpm-native |
| pnpm | ^9.x | Package manager | Fast, disk-efficient, strict dependency isolation, workspace protocol |
| drizzle-orm | ^0.45.1 | TypeScript ORM for PostgreSQL | Type-safe SQL, zero runtime overhead, Relations v2 API, identity columns |
| drizzle-kit | ^0.31.8 | Schema migrations CLI | Generate/push/migrate commands, introspection |
| pg | ^8.x | PostgreSQL driver for Node.js | Standard Node.js PostgreSQL client, used by Drizzle |
| @clerk/react | ^5.61 | React auth SDK (Core 3) | Session management, `<Show>` component, `useAuth()` hook |
| @clerk/express | ^2.0 | Express auth middleware (Core 3) | `clerkMiddleware()`, `requireAuth()`, `getAuth()` |
| express | ^4.x | REST API framework | Industry standard, Clerk has native middleware support |
| react | ^19.x | UI framework | Modern concurrent features, latest with Core 3 support |
| vite | ^6.x | Frontend build tool | Fast HMR, ESM-native, official Tailwind/React support |
| zod | ^3.x | Schema validation | Shared validation between frontend/backend via `@ais/shared` |
| typescript | ^5.x | Type system | Required for Drizzle, Clerk types, and shared package |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | ^4.x | Utility CSS framework | All frontend styling |
| shadcn/ui | latest | UI component library | Sidebar, buttons, cards, forms, layout primitives |
| lucide-react | latest | Icon library | Nav icons, status badges, UI indicators |
| svix | ^1.x | Webhook verification | Verifying Clerk webhook signatures in Express |
| cors | ^2.x | CORS middleware | Express API cross-origin requests from Vite dev server |
| dotenv | latest | Environment variables | Loading `.env` files in API server |
| drizzle-seed | latest | Database seeding | Generating deterministic seed data |
| tsx | latest | TypeScript execution | Running seed scripts and migrations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| drizzle-orm 0.45.x | drizzle-orm 1.0.0-beta | Beta is unstable ("something will definitely break" per team). Use stable. |
| pg (node-postgres) | postgres (porsager) | postgres.js is faster but pg has wider ecosystem support and Drizzle docs default to it |
| Clerk webhook sync | Clerk Backend API just-in-time | Webhook is better here: marketplace needs cross-user data (companies, other users), 70% of Clerk apps skip sync but they don't need relational user data |
| shadcn/ui Sidebar | Custom sidebar | shadcn/ui provides composable SidebarProvider, SidebarContent, SidebarMenu with collapsible support out of the box |

**Installation (apps/api):**
```bash
pnpm add express cors dotenv @clerk/express drizzle-orm pg svix zod
pnpm add -D drizzle-kit tsx @types/pg @types/express @types/cors typescript
```

**Installation (apps/web):**
```bash
pnpm add @clerk/react react react-dom zod
pnpm add -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
pnpm dlx shadcn@latest init -t vite
```

**Installation (packages/shared):**
```bash
pnpm add zod
pnpm add -D typescript
```

**Root:**
```bash
pnpm add -D turbo
```

## Architecture Patterns

### Recommended Project Structure
```
ais-marketplace/
├── apps/
│   ├── web/                        # React + Vite frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/             # shadcn/ui components
│   │   │   │   ├── layout/         # AppShell, Sidebar, DashboardLayout
│   │   │   │   └── shared/         # ComingSoonCard, RoleGuard
│   │   │   ├── pages/              # Route pages (Login, Dashboard shells)
│   │   │   ├── hooks/              # Custom hooks (useRole, useApi)
│   │   │   ├── lib/                # Utils, API client, constants
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── .env.local              # VITE_CLERK_PUBLISHABLE_KEY
│   │   ├── vite.config.ts
│   │   ├── components.json         # shadcn/ui config
│   │   └── package.json
│   └── api/                        # Express + Node backend
│       ├── src/
│       │   ├── db/
│       │   │   ├── schema/         # Drizzle schema files
│       │   │   │   ├── companies.ts
│       │   │   │   ├── users.ts
│       │   │   │   ├── relations.ts
│       │   │   │   └── index.ts    # Re-exports all schemas
│       │   │   ├── index.ts        # DB connection instance
│       │   │   └── seed.ts         # Seed script
│       │   ├── middleware/
│       │   │   ├── auth.ts         # Clerk middleware + role guards
│       │   │   └── error.ts        # Error handling middleware
│       │   ├── routes/
│       │   │   ├── webhooks.ts     # Clerk webhook endpoint
│       │   │   ├── users.ts        # User API routes
│       │   │   └── companies.ts    # Company API routes
│       │   ├── lib/
│       │   │   └── clerk.ts        # Clerk client helpers
│       │   └── index.ts            # Express app entry
│       ├── drizzle/                # Generated migration files
│       ├── drizzle.config.ts
│       ├── .env                    # CLERK_SECRET_KEY, DATABASE_URL, etc.
│       └── package.json
├── packages/
│   └── shared/                     # @ais/shared
│       ├── src/
│       │   ├── types/
│       │   │   ├── user.ts         # User types, role enum
│       │   │   ├── company.ts      # Company types
│       │   │   └── api.ts          # API response wrappers, error shapes
│       │   ├── schemas/
│       │   │   ├── company.ts      # Zod validation schemas
│       │   │   └── user.ts         # Zod validation schemas
│       │   ├── constants/
│       │   │   ├── roles.ts        # Role enum and constants
│       │   │   └── routes.ts       # API route path constants
│       │   └── index.ts            # Barrel export
│       ├── tsconfig.json
│       └── package.json
├── turbo.json
├── pnpm-workspace.yaml
├── package.json                    # Root scripts
└── tsconfig.base.json              # Shared TS config
```

### Pattern 1: Clerk publicMetadata RBAC
**What:** Store user roles in Clerk publicMetadata, expose via custom session token claims, read in both frontend and backend without extra API calls.
**When to use:** Every authenticated request.
**Example:**

```typescript
// Step 1: Clerk Dashboard > Sessions > Customize session token
// Add this JSON template:
{
  "metadata": "{{user.public_metadata}}"
}

// Step 2: @ais/shared - types/user.ts
export const UserRole = {
  ADMIN: 'admin',
  MANUFACTURER: 'manufacturer',
  RETAILER: 'retailer',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// Step 3: apps/api - global types for session claims
// types/globals.d.ts
declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: import('@ais/shared').UserRole;
    };
  }
}

// Step 4: apps/api - middleware/auth.ts
import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import { UserRole } from '@ais/shared';
import type { RequestHandler } from 'express';

export { clerkMiddleware, requireAuth };

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const auth = getAuth(req);
    const userRole = auth.sessionClaims?.metadata?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Step 5: apps/api - routes usage
app.get('/api/admin/users',
  requireAuth(),
  requireRole('admin'),
  async (req, res) => { /* ... */ }
);
```

### Pattern 2: Clerk User Sync via Webhook
**What:** When Clerk creates/updates/deletes a user, sync to local PostgreSQL `users` table via webhook. Needed because the marketplace requires relational data (user belongs to company).
**When to use:** User lifecycle events.
**Example:**

```typescript
// apps/api - routes/webhooks.ts
import { Webhook } from 'svix';
import express from 'express';

const router = express.Router();

// CRITICAL: Use raw body parser, NOT json parser, for webhook route
router.post('/clerk',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET!;
    const wh = new Webhook(WEBHOOK_SECRET);

    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    try {
      const evt = wh.verify(req.body, headers);
      if (evt.type === 'user.created') {
        // Upsert user into local DB
        await db.insert(users).values({
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address,
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          role: evt.data.public_metadata?.role ?? 'retailer',
        }).onConflictDoUpdate({
          target: users.clerkId,
          set: { /* updated fields */ },
        });
      }
      res.status(200).json({ received: true });
    } catch (err) {
      res.status(400).json({ error: 'Invalid webhook' });
    }
  }
);
```

### Pattern 3: Shared Package with Workspace Protocol
**What:** The `@ais/shared` package is consumed by both `apps/web` and `apps/api` via pnpm workspace protocol, providing TypeScript types, Zod schemas, and constants.
**When to use:** Any cross-boundary type or validation logic.
**Example:**

```jsonc
// packages/shared/package.json
{
  "name": "@ais/shared",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./schemas": "./src/schemas/index.ts",
    "./constants": "./src/constants/index.ts"
  }
}

// apps/api/package.json (and apps/web/package.json)
{
  "dependencies": {
    "@ais/shared": "workspace:*"
  }
}

// Usage in any app
import { UserRole } from '@ais/shared/constants';
import { companySchema } from '@ais/shared/schemas';
import type { Company } from '@ais/shared/types';
```

### Pattern 4: Drizzle Schema with Identity Columns and pgEnum
**What:** Define PostgreSQL tables using Drizzle's type-safe schema builder with modern identity columns (not serial) and pgEnum for enumerated types.
**When to use:** All database tables.
**Example:**

```typescript
// apps/api/src/db/schema/companies.ts
import { pgTable, pgEnum, integer, varchar, numeric, text, timestamp } from 'drizzle-orm/pg-core';

export const companyTypeEnum = pgEnum('company_type', ['manufacturer', 'retailer']);

export const companies = pgTable('companies', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  type: companyTypeEnum().notNull(),
  marginPercentage: numeric({ precision: 5, scale: 2 }).notNull().default('10.00'),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  phone: varchar({ length: 20 }).notNull(),
  street: varchar({ length: 255 }),
  city: varchar({ length: 100 }),
  state: varchar({ length: 2 }),
  zip: varchar({ length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// apps/api/src/db/schema/users.ts
import { pgTable, pgEnum, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const userRoleEnum = pgEnum('user_role', ['admin', 'manufacturer', 'retailer']);

export const users = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: userRoleEnum().notNull().default('retailer'),
  companyId: integer('company_id').references(() => companies.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// apps/api/src/db/schema/relations.ts
import { defineRelations } from 'drizzle-orm';
import { users } from './users';
import { companies } from './companies';

export const relations = defineRelations({ users, companies }, (r) => ({
  users: {
    company: r.one.companies({
      from: r.users.companyId,
      to: r.companies.id,
    }),
  },
  companies: {
    users: r.many.users({
      from: r.companies.id,
      to: r.users.companyId,
    }),
  },
}));
```

### Anti-Patterns to Avoid
- **Using serial instead of identity columns:** PostgreSQL and Drizzle now recommend `generatedAlwaysAsIdentity()`. Serial is legacy.
- **Putting Clerk secret key in frontend env:** Only `VITE_CLERK_PUBLISHABLE_KEY` goes in `apps/web`. The `CLERK_SECRET_KEY` stays in `apps/api/.env` only.
- **Applying express.json() globally before webhook routes:** The Clerk webhook endpoint needs `express.raw({ type: 'application/json' })` for Svix signature verification. Apply JSON parser only to non-webhook routes.
- **Storing roles only in the local DB:** Roles MUST be in Clerk publicMetadata AND custom session claims. Otherwise every request needs a DB lookup. The session token is the authority; the local DB is the mirror.
- **Cross-package relative imports (`../../../packages/shared`):** Always use the workspace protocol (`@ais/shared`) and never relative paths between packages.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication | Custom JWT/session management | Clerk SDKs | Session refresh, token rotation, email verification, hosted UI |
| RBAC middleware | Custom token parsing + verification | Clerk `getAuth()` + custom session claims | JWT verification, key rotation, clock skew handled automatically |
| Webhook verification | Custom HMAC signature checking | Svix library | Replay attack prevention, timestamp tolerance, header extraction |
| UI component system | Custom buttons, inputs, cards | shadcn/ui + Tailwind | Accessible, themeable, composable -- dozens of components ready |
| Sidebar navigation | Custom collapsible sidebar from scratch | shadcn/ui Sidebar component | SidebarProvider, SidebarMenu, SidebarGroup, collapsible support built-in |
| Database migrations | Raw SQL files | Drizzle Kit (`generate` + `migrate`) | Schema diffing, migration tracking, rollback safety |
| Monorepo task orchestration | Custom build scripts | Turborepo `turbo.json` | Caching, parallelization, dependency-aware task ordering |
| Form validation | Custom validation functions | Zod schemas in `@ais/shared` | Shared between frontend and backend, TypeScript inference |

**Key insight:** Phase 1 establishes patterns that all subsequent phases build on. Every hand-rolled solution here becomes tech debt multiplied by 5 more phases. Use proven tools.

## Common Pitfalls

### Pitfall 1: Clerk Webhook Raw Body Issue
**What goes wrong:** Webhook signature verification fails with "Expected payload to be of type string or Buffer."
**Why it happens:** Express `express.json()` middleware parses the body before Svix can verify the raw signature.
**How to avoid:** Mount webhook routes BEFORE `express.json()` middleware, or use route-specific `express.raw({ type: 'application/json' })` on the webhook endpoint only.
**Warning signs:** 400 errors from the webhook handler, Svix verification exceptions.

### Pitfall 2: Custom Session Token Size Limit
**What goes wrong:** Clerk session cookie exceeds 4KB browser limit, breaking authentication entirely.
**Why it happens:** Adding too much data to custom session token claims. Only ~1.2KB available for custom claims after Clerk defaults.
**How to avoid:** Only add `publicMetadata` (containing just `{ role: "admin" }`) to session claims. Keep it minimal. Fetch additional user data from the local DB.
**Warning signs:** Authentication intermittently fails, cookies not being set.

### Pitfall 3: pnpm Workspace TypeScript Resolution
**What goes wrong:** TypeScript can't find types from `@ais/shared` in consuming packages.
**Why it happens:** pnpm's strict module isolation means TypeScript needs explicit configuration to resolve workspace packages.
**How to avoid:** Use `exports` field in `@ais/shared/package.json` pointing directly to `.ts` source files (not compiled output). Add `@ais/shared` as a dependency with `workspace:*` protocol. Ensure `tsconfig.json` includes the shared package path.
**Warning signs:** "Cannot find module '@ais/shared'" errors, red squiggles in IDE.

### Pitfall 4: Clerk Core 3 API Changes
**What goes wrong:** Following outdated tutorials that use `<SignedIn>`, `<SignedOut>`, `<Protect>`, or `@clerk/clerk-react`.
**Why it happens:** Core 3 released 2026-03-03 (days ago). Most tutorials online use Core 2 syntax.
**How to avoid:** Use `@clerk/react` (not `@clerk/clerk-react`). Use `<Show when="signed-in">` and `<Show when="signed-out">`. Use `@clerk/express` (not `@clerk/clerk-sdk-node`).
**Warning signs:** Deprecation warnings, components not rendering, import errors.

### Pitfall 5: Drizzle Migration vs Push Confusion
**What goes wrong:** Using `drizzle-kit push` in production-like environments, losing migration history.
**Why it happens:** `push` is convenient for development but doesn't generate migration files for version control.
**How to avoid:** Use `drizzle-kit push` for rapid local development only. Use `drizzle-kit generate` + `drizzle-kit migrate` for anything that needs to be reproducible (CI, staging, production).
**Warning signs:** Schema drift between environments, no migration files in version control.

### Pitfall 6: Seeding Clerk Users Without Syncing to Local DB
**What goes wrong:** Users exist in Clerk but not in the local PostgreSQL `users` table, so foreign key relationships (user -> company) break.
**Why it happens:** Seed script creates users in Clerk but forgets to also insert matching rows in the local DB.
**How to avoid:** The seed script must do both: (1) create users via Clerk Backend API (`clerkClient.users.createUser()`), then (2) insert the corresponding row in the local `users` table with the `clerkId` and `companyId`. Don't rely on the webhook during seeding -- do it synchronously in the script.
**Warning signs:** "User not found" errors when querying local DB, null companyId.

## Code Examples

### Turborepo Configuration

```jsonc
// turbo.json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:generate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```jsonc
// Root package.json
{
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:push": "turbo run db:push",
    "db:generate": "turbo run db:generate",
    "db:seed": "turbo run db:seed"
  },
  "devDependencies": {
    "turbo": "^2.8.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

### Drizzle Configuration

```typescript
// apps/api/drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Express App Setup with Clerk

```typescript
// apps/api/src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { webhookRouter } from './routes/webhooks';
import { userRouter } from './routes/users';
import { companyRouter } from './routes/companies';
import { errorHandler } from './middleware/error';

const app = express();
const port = process.env.PORT || 3001;

// Webhook routes FIRST (need raw body)
app.use('/api/webhooks', webhookRouter);

// Then JSON parser and Clerk middleware for all other routes
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(clerkMiddleware());

// API routes
app.use('/api/users', userRouter);
app.use('/api/companies', companyRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
```

### React App Setup with Clerk Core 3

```typescript
// apps/web/src/main.tsx
import { ClerkProvider } from '@clerk/react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')!).render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    afterSignOutUrl="/"
  >
    <App />
  </ClerkProvider>
);
```

```typescript
// apps/web/src/App.tsx
import { Show, SignIn, UserButton } from '@clerk/react';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';

export default function App() {
  return (
    <>
      <Show when="signed-out">
        <LoginPage />
      </Show>
      <Show when="signed-in">
        <AppShell />
      </Show>
    </>
  );
}
```

### Seed Script Pattern

```typescript
// apps/api/src/db/seed.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createClerkClient } from '@clerk/express';
import { companies, users } from './schema';
import { reset } from 'drizzle-seed';

const db = drizzle(process.env.DATABASE_URL!);
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const DEMO_PASSWORD = 'DemoPass123!';

const seedCompanies = [
  { name: 'AIS Admin Corp', type: 'manufacturer' as const, marginPercentage: '10.00', contactName: 'Dan LeRose', phone: '555-0100', city: 'New York', state: 'NY' },
  { name: 'Luxe Beauty Co.', type: 'manufacturer' as const, marginPercentage: '8.00', contactName: 'Sarah Chen', phone: '555-0101', city: 'Los Angeles', state: 'CA' },
  { name: 'FreshGlow Skincare', type: 'manufacturer' as const, marginPercentage: '12.00', contactName: 'Marcus Johnson', phone: '555-0102', city: 'Miami', state: 'FL' },
  { name: 'Metro Retail Group', type: 'retailer' as const, marginPercentage: '10.00', contactName: 'Lisa Park', phone: '555-0200', city: 'Chicago', state: 'IL' },
  { name: 'BrightShelf Distributors', type: 'retailer' as const, marginPercentage: '10.00', contactName: 'James Wright', phone: '555-0201', city: 'Dallas', state: 'TX' },
];

async function main() {
  console.log('Resetting database...');
  await reset(db, { companies, users });

  console.log('Seeding companies...');
  const insertedCompanies = await db.insert(companies)
    .values(seedCompanies)
    .returning();

  console.log('Seeding users in Clerk + local DB...');
  const seedUsers = [
    { email: 'admin@ais-demo.com', firstName: 'Admin', lastName: 'User', role: 'admin' as const, companyIndex: 0 },
    { email: 'manufacturer@luxebeauty.com', firstName: 'Sarah', lastName: 'Chen', role: 'manufacturer' as const, companyIndex: 1 },
    { email: 'manufacturer@freshglow.com', firstName: 'Marcus', lastName: 'Johnson', role: 'manufacturer' as const, companyIndex: 2 },
    { email: 'retailer@metroretail.com', firstName: 'Lisa', lastName: 'Park', role: 'retailer' as const, companyIndex: 3 },
    { email: 'retailer@brightshelf.com', firstName: 'James', lastName: 'Wright', role: 'retailer' as const, companyIndex: 4 },
  ];

  for (const seedUser of seedUsers) {
    // Create in Clerk
    const clerkUser = await clerk.users.createUser({
      emailAddress: [seedUser.email],
      password: DEMO_PASSWORD,
      firstName: seedUser.firstName,
      lastName: seedUser.lastName,
      publicMetadata: { role: seedUser.role },
      skipPasswordChecks: true,
    });

    // Mirror in local DB
    await db.insert(users).values({
      clerkId: clerkUser.id,
      email: seedUser.email,
      firstName: seedUser.firstName,
      lastName: seedUser.lastName,
      role: seedUser.role,
      companyId: insertedCompanies[seedUser.companyIndex].id,
    });
  }

  console.log('Seed complete!');
  process.exit(0);
}

main().catch(console.error);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@clerk/clerk-react` | `@clerk/react` | Core 3, March 2026 | Package renamed; old name deprecated |
| `<SignedIn>`, `<SignedOut>`, `<Protect>` | `<Show when="...">` with condition callbacks | Core 3, March 2026 | Single unified component replaces three |
| `@clerk/clerk-sdk-node` | `@clerk/express` | Core 2+ | Dedicated Express middleware, proper req.auth |
| Drizzle `serial` columns | `integer().generatedAlwaysAsIdentity()` | Drizzle 0.33+ / 2024 | PostgreSQL identity columns recommended over serial |
| Drizzle Relations v1 (`relations()`) | Relations v2 (`defineRelations()`) | Drizzle 0.44+ | Type-safe, from/to syntax, disambiguation support |
| `ClerkExpressRequireAuth()` | `requireAuth()` from `@clerk/express` | Core 2 | Simplified API, better Express integration |
| `tailwindcss` v3 + PostCSS | `tailwindcss` v4 + `@tailwindcss/vite` plugin | 2025 | Vite-native, no PostCSS config needed |
| `npx shadcn-ui@latest` | `pnpm dlx shadcn@latest` | 2024 | Package renamed from shadcn-ui to shadcn |

**Deprecated/outdated:**
- `@clerk/clerk-react`: Renamed to `@clerk/react` in Core 3
- `@clerk/clerk-sdk-node`: Replaced by `@clerk/express` for Express apps
- `<SignedIn>`, `<SignedOut>`, `<Protect>`: Replaced by `<Show>` in Core 3
- `serial()` in Drizzle: Use `integer().generatedAlwaysAsIdentity()` instead
- Drizzle Relations v1 `relations()` function: Use `defineRelations()` v2 instead

## Open Questions

1. **Clerk Webhook Tunnel for Local Development**
   - What we know: Clerk needs a publicly accessible URL to send webhooks. During local development, a tunnel (ngrok, localtunnel) is required.
   - What's unclear: Whether the seed script should bypass the webhook entirely (creating Clerk users + DB rows in one script) or trigger the webhook.
   - Recommendation: Seed script should bypass the webhook and insert directly into both Clerk and local DB synchronously. Webhook is for runtime user lifecycle events only.

2. **Clerk Core 3 Stability**
   - What we know: Core 3 released 2026-03-03, just 5 days ago. `@clerk/react` 5.61.3 and `@clerk/express` 2.0.1 are current.
   - What's unclear: Whether early Core 3 versions have undiscovered bugs.
   - Recommendation: Use Core 3 since this is greenfield and the API is cleaner. Pin exact versions in package.json. If issues arise, the Core 2 API (`<SignedIn>`, etc.) still works temporarily.

3. **Vite Proxy vs CORS for Frontend-Backend Communication**
   - What we know: Vite dev server can proxy `/api` requests to Express backend. In production, the frontend and API will be separate deployments (Vercel + Railway).
   - What's unclear: Whether to use Vite proxy in dev (simpler, same-origin) or real CORS (matches production).
   - Recommendation: Use CORS from the start to match production behavior. Configure `cors` middleware on Express with the frontend origin. Use environment variable for the API base URL in the React app.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (latest, via Vite ecosystem) |
| Config file | None -- Wave 0 will create `vitest.config.ts` in apps/api and apps/web |
| Quick run command | `pnpm --filter api test` |
| Full suite command | `turbo run test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Seed script creates Clerk user with email/password | integration | `pnpm --filter api test -- --grep "seed"` | No -- Wave 0 |
| AUTH-02 | Clerk-created users have verified email | integration | `pnpm --filter api test -- --grep "verified"` | No -- Wave 0 |
| AUTH-03 | ClerkProvider persists session | manual-only | Manual browser test: login, refresh, verify still logged in | N/A |
| AUTH-04 | Users have role in publicMetadata and session claims | unit | `pnpm --filter api test -- --grep "role"` | No -- Wave 0 |
| AUTH-05 | Role middleware blocks unauthorized access | unit | `pnpm --filter api test -- --grep "rbac"` | No -- Wave 0 |
| AUTH-06 | Companies table has all required fields | unit | `pnpm --filter api test -- --grep "company"` | No -- Wave 0 |
| AUTH-07 | Users table has companyId foreign key | unit | `pnpm --filter api test -- --grep "user-company"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter api test`
- **Per wave merge:** `turbo run test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/vitest.config.ts` -- Vitest configuration for API package
- [ ] `apps/api/src/__tests__/` -- Test directory structure
- [ ] `apps/api/src/__tests__/db/schema.test.ts` -- Schema validation tests (AUTH-06, AUTH-07)
- [ ] `apps/api/src/__tests__/middleware/auth.test.ts` -- RBAC middleware tests (AUTH-04, AUTH-05)
- [ ] `apps/api/src/__tests__/db/seed.test.ts` -- Seed script integration tests (AUTH-01, AUTH-02)
- [ ] Framework install: `pnpm add -D vitest --filter api` -- Vitest not yet installed

## Sources

### Primary (HIGH confidence)
- [Clerk Express Quickstart](https://clerk.com/docs/expressjs/getting-started/quickstart) -- clerkMiddleware, requireAuth, getAuth setup
- [Clerk React Quickstart](https://clerk.com/docs/react/getting-started/quickstart) -- ClerkProvider, Show component, Core 3 API
- [Clerk clerkMiddleware() Reference](https://clerk.com/docs/reference/express/clerk-middleware) -- Configuration options, auth object
- [Clerk Basic RBAC Guide](https://clerk.com/docs/guides/secure/basic-rbac) -- publicMetadata roles, custom session claims
- [Clerk Custom Session Tokens](https://clerk.com/docs/backend-requests/custom-session-token) -- Template configuration, size limits
- [Clerk Core 3 Changelog](https://clerk.com/changelog/2026-03-03-core-3) -- Breaking changes, migration from Core 2
- [Clerk createUser() API](https://clerk.com/docs/reference/backend/user/create-user) -- Parameters for seeding users
- [Clerk Webhook Syncing Guide](https://clerk.com/docs/guides/development/webhooks/syncing) -- Webhook setup, verification
- [Clerk Express + React Blog](https://clerk.com/blog/securing-node-express-apis-clerk-react) -- Full architecture pattern
- [Drizzle ORM PostgreSQL Setup](https://orm.drizzle.team/docs/get-started/postgresql-new) -- Installation, schema, config
- [Drizzle Relations v2](https://orm.drizzle.team/docs/relations-v2) -- defineRelations, one/many syntax
- [Drizzle Schema Declaration](https://orm.drizzle.team/docs/sql-schema-declaration) -- pgEnum, column types, identity columns
- [Drizzle Migrations](https://orm.drizzle.team/docs/migrations) -- push vs generate+migrate
- [Drizzle Seed Overview](https://orm.drizzle.team/docs/seed-overview) -- drizzle-seed API, reset function
- [Turborepo Repository Structure](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) -- Official directory layout
- [Turborepo Task Configuration](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks) -- turbo.json, dependsOn, outputs
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) -- Setup with Vite, monorepo flag
- [shadcn/ui Sidebar Component](https://ui.shadcn.com/docs/components/radix/sidebar) -- SidebarProvider, SidebarMenu

### Secondary (MEDIUM confidence)
- [Clerk Webhooks vs Backend API Comparison](https://clerk.com/blog/webhooks-v-bapi) -- When to use each approach
- [pnpm Workspaces](https://pnpm.io/workspaces) -- workspace:* protocol, configuration
- [Turborepo npm package](https://www.npmjs.com/package/turbo) -- Version 2.8.13 confirmed
- [drizzle-orm npm package](https://www.npmjs.com/package/drizzle-orm) -- Version 0.45.1 confirmed
- [@clerk/express npm package](https://www.npmjs.com/package/@clerk/express) -- Version 2.0.1 confirmed
- [Drizzle v1-beta.2 Release Notes](https://orm.drizzle.team/docs/latest-releases/drizzle-orm-v1beta2) -- Not production ready, use 0.45.x

### Tertiary (LOW confidence)
- [Svix webhook verification issue #1463](https://github.com/svix/svix-webhooks/issues/1463) -- Express raw body gotcha, community-reported

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified on npm, official docs reviewed for each library
- Architecture: HIGH -- Patterns from official Clerk + Drizzle docs, Turborepo structure from official guide
- Pitfalls: HIGH -- Documented in official docs (webhook raw body, session token size) and GitHub issues
- Clerk Core 3: MEDIUM -- Released 5 days ago; API confirmed from official changelog but limited community battle-testing

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable stack, pin versions)
