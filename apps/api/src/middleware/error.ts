import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[API Error]', err);

  if (err instanceof ZodError) {
    const { fieldErrors, formErrors } = err.flatten();
    res.status(400).json({ error: 'Validation failed', fieldErrors, formErrors });
    return;
  }

  const status = err.status ?? err.statusCode ?? 500;
  const message =
    status === 500 ? 'Internal server error' : err.message ?? 'Unknown error';

  res.status(status).json({ error: message });
};
