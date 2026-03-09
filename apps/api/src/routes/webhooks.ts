import { Router, type Router as RouterType } from 'express';
import express from 'express';
import { Webhook } from 'svix';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';

const router: RouterType = Router();

/**
 * POST /clerk — Clerk webhook handler with Svix signature verification.
 *
 * CRITICAL: Uses express.raw() as route-level middleware, NOT express.json().
 * The Svix library requires the raw body (Buffer) to verify the signature.
 * This route must be mounted BEFORE the global express.json() middleware.
 */
router.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('Missing CLERK_WEBHOOK_SIGNING_SECRET env var');
      res.status(500).json({ error: 'Server misconfigured' });
      return;
    }

    const wh = new Webhook(WEBHOOK_SECRET);

    const headers = {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    };

    let evt: Record<string, unknown>;

    try {
      evt = wh.verify(req.body, headers) as Record<string, unknown>;
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).json({ error: 'Invalid webhook signature' });
      return;
    }

    const eventType = evt.type as string;
    const data = evt.data as Record<string, unknown>;

    try {
      switch (eventType) {
        case 'user.created': {
          const emailAddresses = data.email_addresses as Array<{
            email_address: string;
          }>;
          const publicMetadata = data.public_metadata as
            | { role?: string }
            | undefined;

          await db
            .insert(users)
            .values({
              clerkId: data.id as string,
              email: emailAddresses[0]?.email_address ?? '',
              firstName: (data.first_name as string) ?? null,
              lastName: (data.last_name as string) ?? null,
              role: (publicMetadata?.role as 'admin' | 'manufacturer' | 'retailer') ?? 'retailer',
            })
            .onConflictDoUpdate({
              target: users.clerkId,
              set: {
                email: emailAddresses[0]?.email_address ?? '',
                firstName: (data.first_name as string) ?? null,
                lastName: (data.last_name as string) ?? null,
                role: (publicMetadata?.role as 'admin' | 'manufacturer' | 'retailer') ?? 'retailer',
                updatedAt: new Date(),
              },
            });
          break;
        }

        case 'user.updated': {
          const emailAddresses = data.email_addresses as Array<{
            email_address: string;
          }>;
          const publicMetadata = data.public_metadata as
            | { role?: string }
            | undefined;

          await db
            .update(users)
            .set({
              email: emailAddresses[0]?.email_address ?? '',
              firstName: (data.first_name as string) ?? null,
              lastName: (data.last_name as string) ?? null,
              role: (publicMetadata?.role as 'admin' | 'manufacturer' | 'retailer') ?? 'retailer',
              updatedAt: new Date(),
            })
            .where(eq(users.clerkId, data.id as string));
          break;
        }

        case 'user.deleted': {
          await db
            .delete(users)
            .where(eq(users.clerkId, data.id as string));
          break;
        }

        default:
          // Unhandled event type — acknowledge receipt
          break;
      }

      res.status(200).json({ received: true });
    } catch (err) {
      console.error(`Error processing webhook event ${eventType}:`, err);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

export { router as webhookRouter };
