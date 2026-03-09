import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('[API Error]', err);

  if (err instanceof ZodError) {
    const messages = err.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`
    );
    res.status(400).json({ error: 'Validation failed', details: messages });
    return;
  }

  const status = err.status ?? err.statusCode ?? 500;
  const message =
    status === 500 ? 'Internal server error' : err.message ?? 'Unknown error';

  res.status(status).json({ error: message });
};
