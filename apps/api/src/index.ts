import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express';
import { API_ROUTES } from '@ais/shared/constants';
import { companyRouter } from './routes/companies.js';
import { userRouter } from './routes/users.js';
import { errorHandler } from './middleware/error.js';

const app: Express = express();
const port = process.env.PORT || 3001;

// Webhook routes FIRST (need raw body) — actual webhook handler added in Plan 03
// app.use('/api/webhooks', webhookRouter);

// Then JSON parser, CORS, and Clerk middleware for all other routes
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(clerkMiddleware());

// API routes
app.use(API_ROUTES.COMPANIES, companyRouter);
app.use(API_ROUTES.USERS, userRouter);

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
