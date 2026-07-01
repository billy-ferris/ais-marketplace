import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Keep the seed module's top-level init inert on import (no real DB/Clerk).
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => ({})),
}));
vi.mock('@clerk/express', () => ({
  createClerkClient: vi.fn(() => ({ users: {} })),
}));

import { assertNotProduction } from '../../db/seed';

describe('assertNotProduction (seed production guard, D-08)', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let exitSpy: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let errorSpy: any;

  beforeEach(() => {
    exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation(((_code?: number) => undefined) as never);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (ORIGINAL_NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    }
    vi.restoreAllMocks();
  });

  it('calls process.exit(1) after logging when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';

    assertNotProduction();

    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('does NOT call process.exit when NODE_ENV=development', () => {
    process.env.NODE_ENV = 'development';

    assertNotProduction();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does NOT call process.exit when NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';

    assertNotProduction();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('does NOT call process.exit when NODE_ENV is unset', () => {
    delete process.env.NODE_ENV;

    assertNotProduction();

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('reads no override/escape-hatch env var (D-08 forbids one)', () => {
    // Even with common "force" flags set, production must still refuse.
    process.env.NODE_ENV = 'production';
    process.env.FORCE_SEED = '1';
    process.env.ALLOW_PRODUCTION_SEED = 'true';

    assertNotProduction();

    expect(exitSpy).toHaveBeenCalledWith(1);

    delete process.env.FORCE_SEED;
    delete process.env.ALLOW_PRODUCTION_SEED;
  });
});
