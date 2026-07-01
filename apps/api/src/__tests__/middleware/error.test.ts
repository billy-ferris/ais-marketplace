import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createCategorySchema } from '@ais/shared/schemas';
import { errorHandler } from '../../middleware/error';

/**
 * Create a mock Express res that captures the status code and json body.
 */
function createMockRes() {
  const captured: { status?: number; body?: any } = {};
  const res = {
    status: vi.fn((code: number) => {
      captured.status = code;
      return res;
    }),
    json: vi.fn((body: any) => {
      captured.body = body;
      return res;
    }),
  } as unknown as Response;
  return { res, captured };
}

const req = {} as Request;
const next = vi.fn() as NextFunction;

describe('errorHandler', () => {
  describe('ZodError', () => {
    it('responds 400 with { error, fieldErrors, formErrors } and no details key', () => {
      const parsed = createCategorySchema.safeParse({});
      expect(parsed.success).toBe(false);
      if (parsed.success) return;

      const { res, captured } = createMockRes();
      errorHandler(parsed.error, req, res, next);

      expect(captured.status).toBe(400);
      expect(captured.body).toMatchObject({ error: 'Validation failed' });
      expect(captured.body).toHaveProperty('fieldErrors');
      expect(captured.body).toHaveProperty('formErrors');
      expect(captured.body).not.toHaveProperty('details');
    });

    it('fieldErrors is an object whose values are string arrays (Zod flatten shape)', () => {
      const parsed = createCategorySchema.safeParse({});
      if (parsed.success) return;

      const { res, captured } = createMockRes();
      errorHandler(parsed.error, req, res, next);

      const { fieldErrors, formErrors } = captured.body;
      expect(typeof fieldErrors).toBe('object');
      // name is required (min(1)) so it should have an error array
      expect(Array.isArray(fieldErrors.name)).toBe(true);
      expect(fieldErrors.name.every((m: unknown) => typeof m === 'string')).toBe(
        true,
      );
      expect(Array.isArray(formErrors)).toBe(true);
    });

    it('matches err.flatten() output exactly', () => {
      const parsed = createCategorySchema.safeParse({});
      if (parsed.success) return;

      const flat = parsed.error.flatten();
      const { res, captured } = createMockRes();
      errorHandler(parsed.error, req, res, next);

      expect(captured.body.fieldErrors).toEqual(flat.fieldErrors);
      expect(captured.body.formErrors).toEqual(flat.formErrors);
    });
  });

  describe('non-Zod errors', () => {
    it('masks a 500 error as { error: "Internal server error" }', () => {
      const { res, captured } = createMockRes();
      errorHandler(new Error('boom with secret db details'), req, res, next);

      expect(captured.status).toBe(500);
      expect(captured.body).toEqual({ error: 'Internal server error' });
    });

    it('passes through a custom status/message error unchanged', () => {
      const customErr: any = new Error('Bad request payload');
      customErr.status = 400;

      const { res, captured } = createMockRes();
      errorHandler(customErr, req, res, next);

      expect(captured.status).toBe(400);
      expect(captured.body).toEqual({ error: 'Bad request payload' });
    });
  });
});
