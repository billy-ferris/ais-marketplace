import { describe, it, expect, afterEach } from 'vitest';
import type { CorsOptions } from 'cors';
import { buildCorsOptions, staticAllowedOrigins } from '../../lib/cors';

/**
 * The cors package's origin callback shape (CustomOrigin), narrowed for tests.
 */
type OriginFn = (
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void,
) => void;

/**
 * Invoke the cors options.origin function synchronously and capture (err, allow)
 * — the callback-capture idiom (analogous to error.test.ts's mock-res capture).
 */
function callOrigin(options: CorsOptions, origin: string | undefined) {
  const captured: { err: Error | null; allow?: boolean } = { err: null };
  const originFn = options.origin as OriginFn;
  originFn(origin, (err, allow) => {
    captured.err = err;
    captured.allow = allow;
  });
  return captured;
}

describe('CORS origin allowlist (D-02/D-09)', () => {
  // env save/restore idiom (per seed/guard.test.ts) so tests never leak env state.
  const ORIGINAL_ALLOWED = process.env.CORS_ALLOWED_ORIGINS;
  const ORIGINAL_PREVIEW = process.env.CORS_PREVIEW_PATTERN;

  afterEach(() => {
    if (ORIGINAL_ALLOWED === undefined) {
      delete process.env.CORS_ALLOWED_ORIGINS;
    } else {
      process.env.CORS_ALLOWED_ORIGINS = ORIGINAL_ALLOWED;
    }
    if (ORIGINAL_PREVIEW === undefined) {
      delete process.env.CORS_PREVIEW_PATTERN;
    } else {
      process.env.CORS_PREVIEW_PATTERN = ORIGINAL_PREVIEW;
    }
  });

  it('allows an origin listed in CORS_ALLOWED_ORIGINS', () => {
    process.env.CORS_ALLOWED_ORIGINS =
      'https://app.example.com, https://admin.example.com';
    delete process.env.CORS_PREVIEW_PATTERN;

    const { err, allow } = callOrigin(
      buildCorsOptions(),
      'https://admin.example.com',
    );

    expect(err).toBeNull();
    expect(allow).toBe(true);
  });

  it('allows an origin matching CORS_PREVIEW_PATTERN', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com';
    process.env.CORS_PREVIEW_PATTERN = String.raw`^https://myapp-[a-z0-9]+-myscope\.vercel\.app$`;

    const { err, allow } = callOrigin(
      buildCorsOptions(),
      'https://myapp-abc123-myscope.vercel.app',
    );

    expect(err).toBeNull();
    expect(allow).toBe(true);
  });

  it('allows a request with no Origin header (curl/server-to-server/same-origin)', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com';

    const { err, allow } = callOrigin(buildCorsOptions(), undefined);

    expect(err).toBeNull();
    expect(allow).toBe(true);
  });

  it('rejects an origin that is neither listed nor matches the preview pattern', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com';
    process.env.CORS_PREVIEW_PATTERN = String.raw`\.vercel\.app$`;

    const { err, allow } = callOrigin(
      buildCorsOptions(),
      'https://evil.example.com',
    );

    expect(err).toBeInstanceOf(Error);
    expect(allow).toBeFalsy();
  });

  it('does not admit an unrelated origin when CORS_PREVIEW_PATTERN is unset', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com';
    delete process.env.CORS_PREVIEW_PATTERN;

    const { err, allow } = callOrigin(
      buildCorsOptions(),
      'https://myapp-abc123.vercel.app',
    );

    expect(err).toBeInstanceOf(Error);
    expect(allow).toBeFalsy();
  });

  it('defaults the allowlist to http://localhost:5173 when CORS_ALLOWED_ORIGINS is unset', () => {
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.CORS_PREVIEW_PATTERN;

    expect(staticAllowedOrigins()).toEqual(['http://localhost:5173']);

    const { err, allow } = callOrigin(
      buildCorsOptions(),
      'http://localhost:5173',
    );

    expect(err).toBeNull();
    expect(allow).toBe(true);
  });

  it('keeps credentials enabled for cross-origin cookie/Bearer flows', () => {
    const options = buildCorsOptions();
    expect(options.credentials).toBe(true);
  });
});
