import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[API Error]', err);

  if (err instanceof ZodError) {
    const { fieldErrors, formErrors } = err.flatten();
    res.status(400).json({ error: 'Validation failed', fieldErrors, formErrors });
    return;
  }

  // Be defensive: application code can `throw`/`next()` a non-object value
  // (null, string, number). Normalize so property access can't throw a
  // TypeError inside the last line of defense.
  const err2 =
    err && typeof err === 'object' ? err : { message: String(err) };

  // Use a validated integer status in the 100-599 range; `??` alone would let
  // a falsy-but-defined status like `0` through and `res.status(0)` throws.
  const rawStatus = err2.status ?? err2.statusCode;
  const status =
    Number.isInteger(rawStatus) && rawStatus >= 100 && rawStatus <= 599
      ? rawStatus
      : 500;
  const message =
    status === 500 ? 'Internal server error' : err2.message ?? 'Unknown error';

  res.status(status).json({ error: message });
};
