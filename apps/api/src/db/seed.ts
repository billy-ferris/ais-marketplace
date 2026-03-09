import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createClerkClient } from '@clerk/express';
import { eq } from 'drizzle-orm';
import { companies } from './schema/companies.js';
import { users } from './schema/users.js';
import * as schema from './schema/index.js';

// Initialize database and Clerk client
const db = drizzle(process.env.DATABASE_URL!, { schema });
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const DEMO_PASSWORD = 'DemoPass123!';

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const seedCompanies = [
  {
    name: 'AIS Admin Corp',
    type: 'manufacturer' as const,
    marginPercentage: '10.00',
    contactName: 'Dan LeRose',
    phone: '555-0100',
    city: 'New York',
    state: 'NY',
  },
  {
    name: 'Luxe Beauty Co.',
    type: 'manufacturer' as const,
    marginPercentage: '8.00',
    contactName: 'Sarah Chen',
    phone: '555-0101',
    city: 'Los Angeles',
    state: 'CA',
  },
  {
    name: 'FreshGlow Skincare',
    type: 'manufacturer' as const,
    marginPercentage: '12.00',
    contactName: 'Marcus Johnson',
    phone: '555-0102',
    city: 'Miami',
    state: 'FL',
  },
  {
    name: 'Metro Retail Group',
    type: 'retailer' as const,
    marginPercentage: '10.00',
    contactName: 'Lisa Park',
    phone: '555-0200',
    city: 'Chicago',
    state: 'IL',
  },
  {
    name: 'BrightShelf Distributors',
    type: 'retailer' as const,
    marginPercentage: '10.00',
    contactName: 'James Wright',
    phone: '555-0201',
    city: 'Dallas',
    state: 'TX',
  },
];

const seedUsers = [
  {
    email: 'admin@ais-demo.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin' as const,
    companyIndex: 0,
  },
  {
    email: 'manufacturer@luxebeauty.com',
    firstName: 'Sarah',
    lastName: 'Chen',
    role: 'manufacturer' as const,
    companyIndex: 1,
  },
  {
    email: 'manufacturer@freshglow.com',
    firstName: 'Marcus',
    lastName: 'Johnson',
    role: 'manufacturer' as const,
    companyIndex: 2,
  },
  {
    email: 'retailer@metroretail.com',
    firstName: 'Lisa',
    lastName: 'Park',
    role: 'retailer' as const,
    companyIndex: 3,
  },
  {
    email: 'retailer@brightshelf.com',
    firstName: 'James',
    lastName: 'Wright',
    role: 'retailer' as const,
    companyIndex: 4,
  },
];

// ---------------------------------------------------------------------------
// Cleanup helpers
// ---------------------------------------------------------------------------

/**
 * Delete seed users from Clerk by looking up each email.
 * Silently skips if user does not exist.
 */
async function cleanClerkUsers(): Promise<void> {
  for (const seedUser of seedUsers) {
    try {
      const clerkUsers = await clerk.users.getUserList({
        emailAddress: [seedUser.email],
      });

      for (const cu of clerkUsers.data) {
        await clerk.users.deleteUser(cu.id);
        console.log(`  Deleted Clerk user: ${seedUser.email}`);
      }
    } catch {
      // User not found — nothing to clean
    }
  }
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('--- AIS Marketplace Seed Script ---\n');

  // 1. Clean existing data
  console.log('Cleaning existing seed data...');

  // Delete local users first (FK dependency), then companies
  await db.delete(users);
  await db.delete(companies);
  console.log('  Cleared local users and companies tables');

  // Delete seed users from Clerk
  await cleanClerkUsers();
  console.log('  Cleaned Clerk users\n');

  // 2. Insert companies
  console.log('Seeding companies...');
  const insertedCompanies = await db
    .insert(companies)
    .values(seedCompanies)
    .returning();
  console.log(`  ${insertedCompanies.length} companies created\n`);

  // 3. Create users in both Clerk and local DB
  console.log('Seeding users (Clerk + local DB)...');
  let usersCreated = 0;

  for (const seedUser of seedUsers) {
    try {
      // Create user in Clerk
      const clerkUser = await clerk.users.createUser({
        emailAddress: [seedUser.email],
        password: DEMO_PASSWORD,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        publicMetadata: { role: seedUser.role },
        skipPasswordChecks: true,
      });

      // Mirror user in local database
      await db.insert(users).values({
        clerkId: clerkUser.id,
        email: seedUser.email,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        role: seedUser.role,
        companyId: insertedCompanies[seedUser.companyIndex].id,
      });

      usersCreated++;
      console.log(
        `  Created: ${seedUser.email} (${seedUser.role}) -> ${insertedCompanies[seedUser.companyIndex].name}`
      );
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 409 || error.status === 422) {
        console.warn(
          `  Warning: ${seedUser.email} already exists in Clerk, skipping`
        );
      } else {
        console.error(`  Error creating ${seedUser.email}:`, error.message);
        throw err;
      }
    }
  }

  console.log(`\n--- Seed Complete ---`);
  console.log(`  Companies: ${insertedCompanies.length}`);
  console.log(`  Users: ${usersCreated}`);
  console.log(`  Demo password: ${DEMO_PASSWORD}`);
  console.log(`\nSeed users can log in at the web app with their email and the shared demo password.`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nSeed failed:', err);
    process.exit(1);
  });
