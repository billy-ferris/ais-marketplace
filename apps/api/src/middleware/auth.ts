import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import type { UserRole } from '@ais/shared';
import type { Request, RequestHandler } from 'express';

export { clerkMiddleware, requireAuth };

/**
 * Middleware that enforces role-based access control.
 * Reads the role from Clerk session claims (publicMetadata exposed via custom session token).
 * Returns 403 if the user's role is not in the allowed list.
 */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, res, next) => {
    const auth = getAuth(req);
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
  const auth = getAuth(req);
  return {
    userId: auth.userId,
    role: auth.sessionClaims?.metadata?.role ?? null,
    sessionClaims: auth.sessionClaims,
  };
}
