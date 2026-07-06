import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { API_ROUTES } from '@ais/shared/constants';
import { buildCorsOptions, staticAllowedOrigins } from './lib/cors';
import { webhookRouter } from './routes/webhooks';
import { companyRouter } from './routes/companies';
import { userRouter } from './routes/users';
import { brandRouter } from './routes/brands';
import { categoryRouter } from './routes/categories';
import { uploadRouter } from './routes/uploads';
import { listingRouter } from './routes/listings';
import { notificationRouter } from './routes/notifications';
import { errorHandler } from './middleware/error';

const app: Express = express();
const port = process.env.PORT || 3001;

// Webhook routes FIRST (need raw body — Svix signature verification requires Buffer, not parsed JSON)
app.use('/api/webhooks', webhookRouter);

// Then JSON parser, CORS, and Clerk middleware for all other routes.
// CORS runs before Clerk; both are driven by the same env allowlist so tokens
// are only accepted from authorized frontends (authorizedParties, D-08).
app.use(express.json());
app.use(cors(buildCorsOptions()));
app.use(clerkMiddleware({ authorizedParties: staticAllowedOrigins() }));

// API routes
app.use(API_ROUTES.COMPANIES, companyRouter);
app.use(API_ROUTES.USERS, userRouter);
app.use(API_ROUTES.BRANDS, brandRouter);
app.use(API_ROUTES.CATEGORIES, categoryRouter);
app.use(API_ROUTES.UPLOADS, uploadRouter);
app.use(API_ROUTES.LISTINGS, listingRouter);
app.use(API_ROUTES.NOTIFICATIONS, notificationRouter);

// Health check
app.get(API_ROUTES.HEALTH, (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});

export default app;
