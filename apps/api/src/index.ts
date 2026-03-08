import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import { API_ROUTES } from '@ais/shared/constants';

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.get(API_ROUTES.HEALTH, (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});

export default app;
