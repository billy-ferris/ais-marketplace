import type { CorsOptions } from 'cors';

/**
 * The static CORS allowlist, parsed from `CORS_ALLOWED_ORIGINS`
 * (comma-separated). Defaults to the local Vite dev origin when unset.
 *
 * This is intentionally kept SEPARATE from `FRONTEND_URL`, which remains a
 * single canonical URL used by the email service for CTA links
 * (apps/api/src/services/email.ts) and must not be overloaded into a list.
 *
 * Feeds both `cors()` and Clerk's `authorizedParties` so the two stay in sync.
 */
export function staticAllowedOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build the `cors()` options with an env-driven origin allowlist plus an
 * optional preview-URL regex (`CORS_PREVIEW_PATTERN`, e.g. Vercel preview
 * deployments `https://<project>-<hash>-<scope>.vercel.app`).
 *
 * Behavior of the origin function:
 *  - no Origin header (curl/server-to-server/same-origin) → allow
 *  - origin in the static allowlist → allow
 *  - origin matching `CORS_PREVIEW_PATTERN` (when set) → allow
 *  - anything else → reject (never `*`, never reflect-any-origin)
 */
export function buildCorsOptions(): CorsOptions {
  const staticAllow = staticAllowedOrigins();
  const previewRe = process.env.CORS_PREVIEW_PATTERN
    ? new RegExp(process.env.CORS_PREVIEW_PATTERN)
    : null;

  return {
    origin(origin, cb) {
      // curl / same-origin / server-to-server requests carry no Origin header.
      if (!origin) return cb(null, true);
      if (staticAllow.includes(origin)) return cb(null, true);
      if (previewRe?.test(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  };
}
