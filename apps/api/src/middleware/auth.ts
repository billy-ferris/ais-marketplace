import { clerkMiddleware, getAuth } from '@clerk/express';
import type { UserRole } from '@ais/shared';
import type { Request, RequestHandler } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { users } from '../db/schema/index';

export { clerkMiddleware };

/**
 * API-friendly auth middleware that returns 401 JSON instead of redirecting.
 * The default @clerk/express requireAuth() redirects to "/" on failure,
 * which causes fetch to follow the redirect and break SPA API calls.
 */
export function requireAuth(): RequestHandler {
  return (req, res, next) => {
    const auth = getAuth(req, { acceptsToken: 'session_token' });
    if (!auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };
}

/**
 * Middleware that enforces role-based access control.
 * Reads the role from Clerk session claims (publicMetadata exposed via custom session token).
 * Returns 403 if the user's role is not in the allowed list.
 */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const auth = getAuth(req, { acceptsToken: 'session_token' });
    const userRole = auth.sessionClaims?.metadata?.role;

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    next();
  };
}

/**
 * Helper to extract auth info from the current request.
 * Returns userId, role, and full sessionClaims.
 */
export function getCurrentUser(req: Request) {
  const auth = getAuth(req, { acceptsToken: 'session_token' });
  return {
    userId: auth.userId,
    role: (auth.sessionClaims?.metadata?.role ?? null) as UserRole | null,
    sessionClaims: auth.sessionClaims,
  };
}

/**
 * Look up the local database user from the Clerk userId on the request.
 * Returns user record with id, companyId, role, email, firstName -- or null if not found.
 * Centralizes the companyId lookup pattern for manufacturer scoping.
 */
export async function getCompanyUser(req: Request) {
  const { userId: clerkId } = getCurrentUser(req);
  if (!clerkId) return null;

  return db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
    columns: {
      id: true,
      companyId: true,
      role: true,
      email: true,
      firstName: true,
    },
  }) ?? null;
}
