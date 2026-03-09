import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createClerkClient } from '@clerk/express';
import { eq } from 'drizzle-orm';
import { companies } from './schema/companies';
import { users } from './schema/users';
import { brands } from './schema/brands';
import { categories } from './schema/categories';
import { brandListings } from './schema/brand-listings';
import { inventorySkus } from './schema/inventory-skus';
import { listingCategories } from './schema/listing-categories';
import { brandListingImages } from './schema/brand-listing-images';
import * as schema from './schema/index';
import { CPG_CATEGORIES } from '@ais/shared/constants';

// Initialize database and Clerk client
const db = drizzle(process.env.DATABASE_URL!, { schema });
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const DEMO_PASSWORD = 'AisMarket2026!';

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
    name: 'Summit Home Appliances',
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
    email: 'manufacturer@summithome.com',
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
// Catalog seed data definitions
// ---------------------------------------------------------------------------

/** Brands linked to manufacturer companies by companyIndex */
const seedBrands = [
  {
    name: 'Summit Home Collection',
    slug: 'summit-home-collection',
    description: 'Premium home essentials and kitchen products by Summit Home Appliances.',
    companyIndex: 1,
  },
  {
    name: 'FreshGlow Beauty',
    slug: 'freshglow-beauty',
    description: 'Professional-grade skincare and hair care solutions for everyday beauty.',
    companyIndex: 2,
  },
  {
    name: 'GlowPro Essentials',
    slug: 'glowpro-essentials',
    description: 'Affordable beauty tools and cosmetics by FreshGlow Skincare.',
    companyIndex: 2,
  },
];

/** Listings with brand index and category slug assignments */
const seedListings = [
  {
    name: 'Premium Hair Care Bundle',
    description: 'A curated collection of professional hair care products including shampoo, conditioner, and styling treatments.',
    brandIndex: 1, // FreshGlow Beauty
    status: 'active' as const,
    categorySlugs: ['hair-care', 'skincare'],
  },
  {
    name: 'Professional Beauty Tools Set',
    description: 'Complete set of beauty tools for professional makeup application and styling.',
    brandIndex: 2, // GlowPro Essentials
    status: 'active' as const,
    categorySlugs: ['beauty-tools', 'makeup'],
  },
  {
    name: 'Luxury Fragrance Collection',
    description: 'An exclusive collection of designer-inspired fragrances for every occasion.',
    brandIndex: 1, // FreshGlow Beauty
    status: 'draft' as const,
    categorySlugs: ['fragrances'],
  },
  {
    name: 'Summit Kitchen Essentials',
    description: 'Must-have kitchen wellness products for a healthier lifestyle.',
    brandIndex: 0, // Summit Home Collection
    status: 'active' as const,
    categorySlugs: ['health-wellness'],
  },
  {
    name: 'Seasonal Nail Art Kit',
    description: 'Trendy nail art supplies and tools for creating salon-quality nail designs at home.',
    brandIndex: 2, // GlowPro Essentials
    status: 'active' as const,
    categorySlugs: ['nail-care', 'makeup'],
  },
];

/** SKUs grouped by listing index */
const seedSkusByListing: Array<Array<{
  name: string;
  description: string;
  upc: string;
  size: string;
  casePack: number;
  price: string;
  msrp: string;
  quantity: number;
  expirationDate: string | null;
}>> = [
  // Listing 0: Premium Hair Care Bundle
  [
    {
      name: 'Hydrating Shampoo 12oz',
      description: 'Sulfate-free moisturizing shampoo for all hair types.',
      upc: '894501234501',
      size: '12 oz',
      casePack: 12,
      price: '18.99',
      msrp: '24.99',
      quantity: 200,
      expirationDate: '2027-06-15',
    },
    {
      name: 'Deep Conditioner 8oz',
      description: 'Intensive deep conditioning treatment with argan oil.',
      upc: '894501234502',
      size: '8 oz',
      casePack: 12,
      price: '22.99',
      msrp: '29.99',
      quantity: 150,
      expirationDate: '2027-06-15',
    },
    {
      name: 'Leave-In Styling Cream 6oz',
      description: 'Lightweight styling cream for frizz control and shine.',
      upc: '894501234503',
      size: '6 oz',
      casePack: 24,
      price: '14.99',
      msrp: '19.99',
      quantity: 300,
      expirationDate: '2027-09-01',
    },
  ],
  // Listing 1: Professional Beauty Tools Set
  [
    {
      name: 'Makeup Brush Set (12pc)',
      description: 'Professional 12-piece makeup brush set with synthetic bristles.',
      upc: '894502345601',
      size: '12 pack',
      casePack: 6,
      price: '34.99',
      msrp: '49.99',
      quantity: 100,
      expirationDate: null,
    },
    {
      name: 'Eyelash Curler Pro',
      description: 'Ergonomic eyelash curler with silicone pads for a perfect curl.',
      upc: '894502345602',
      size: '1 ct',
      casePack: 24,
      price: '12.99',
      msrp: '17.99',
      quantity: 250,
      expirationDate: null,
    },
  ],
  // Listing 2: Luxury Fragrance Collection
  [
    {
      name: 'Midnight Bloom Eau de Parfum 3.4oz',
      description: 'A rich floral fragrance with notes of jasmine and sandalwood.',
      upc: '894503456701',
      size: '3.4 oz',
      casePack: 6,
      price: '54.99',
      msrp: '79.99',
      quantity: 75,
      expirationDate: null,
    },
    {
      name: 'Citrus Breeze Body Mist 8oz',
      description: 'Refreshing citrus body mist for everyday wear.',
      upc: '894503456702',
      size: '8 oz',
      casePack: 12,
      price: '19.99',
      msrp: '27.99',
      quantity: 180,
      expirationDate: '2027-12-31',
    },
  ],
  // Listing 3: Summit Kitchen Essentials
  [
    {
      name: 'Organic Green Tea Blend 100ct',
      description: 'Premium organic green tea bags for daily wellness.',
      upc: '894504567801',
      size: '100 ct',
      casePack: 12,
      price: '24.99',
      msrp: '34.99',
      quantity: 400,
      expirationDate: '2027-03-01',
    },
    {
      name: 'Vitamin C Immunity Gummies 60ct',
      description: 'Daily vitamin C gummies for immune support.',
      upc: '894504567802',
      size: '60 ct',
      casePack: 24,
      price: '16.99',
      msrp: '22.99',
      quantity: 500,
      expirationDate: '2027-08-15',
    },
    {
      name: 'Stainless Steel Water Bottle 32oz',
      description: 'Double-wall insulated water bottle, keeps drinks cold 24 hours.',
      upc: '894504567803',
      size: '32 oz',
      casePack: 6,
      price: '29.99',
      msrp: '39.99',
      quantity: 120,
      expirationDate: null,
    },
  ],
  // Listing 4: Seasonal Nail Art Kit
  [
    {
      name: 'Gel Nail Polish Set (8 colors)',
      description: 'UV/LED gel polish set with trendy seasonal colors.',
      upc: '894505678901',
      size: '8 pack',
      casePack: 12,
      price: '28.99',
      msrp: '39.99',
      quantity: 150,
      expirationDate: '2027-10-01',
    },
    {
      name: 'Nail Art Stamping Kit',
      description: 'Complete nail art stamping kit with plates, scraper, and stamper.',
      upc: '894505678902',
      size: '1 kit',
      casePack: 24,
      price: '15.99',
      msrp: '21.99',
      quantity: 200,
      expirationDate: null,
    },
    {
      name: 'Cuticle Oil Pen 3-Pack',
      description: 'Nourishing cuticle oil pens with vitamin E and jojoba oil.',
      upc: '894505678903',
      size: '3 pack',
      casePack: 36,
      price: '9.99',
      msrp: '14.99',
      quantity: 350,
      expirationDate: '2028-01-15',
    },
  ],
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

  // Clean catalog tables first (FK order: join tables -> children -> parents)
  await db.delete(listingCategories);
  await db.delete(brandListingImages);
  await db.delete(inventorySkus);
  await db.delete(brandListings);
  await db.delete(brands);
  await db.delete(categories);
  console.log('  Cleared catalog tables (listing_categories, brand_listing_images, inventory_skus, brand_listings, brands, categories)');

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

  // ---------------------------------------------------------------------------
  // 4. Seed catalog data
  // ---------------------------------------------------------------------------
  console.log('\nSeeding catalog data...');

  // 4a. Seed categories from CPG_CATEGORIES constant
  console.log('  Seeding categories...');
  const categoryValues = CPG_CATEGORIES.map((cat, index) => ({
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    displayOrder: index,
  }));
  const insertedCategories = await db
    .insert(categories)
    .values(categoryValues)
    .returning();
  console.log(`    ${insertedCategories.length} categories created`);

  // Build slug -> id map for category assignment
  const categoryBySlug = new Map(
    insertedCategories.map((c) => [c.slug, c.id])
  );

  // 4b. Seed brands
  console.log('  Seeding brands...');
  const brandValues = seedBrands.map((b) => ({
    name: b.name,
    slug: b.slug,
    description: b.description,
    companyId: insertedCompanies[b.companyIndex].id,
  }));
  const insertedBrands = await db
    .insert(brands)
    .values(brandValues)
    .returning();
  console.log(`    ${insertedBrands.length} brands created`);

  // 4c. Seed listings
  console.log('  Seeding listings...');
  const insertedListings = [];
  for (const listing of seedListings) {
    const [inserted] = await db
      .insert(brandListings)
      .values({
        name: listing.name,
        description: listing.description,
        brandId: insertedBrands[listing.brandIndex].id,
        status: listing.status,
      })
      .returning();
    insertedListings.push({ ...inserted, categorySlugs: listing.categorySlugs });
  }
  console.log(`    ${insertedListings.length} listings created`);

  // 4d. Seed listing_categories (many-to-many)
  console.log('  Seeding listing-category assignments...');
  let categoryAssignments = 0;
  for (const listing of insertedListings) {
    for (const slug of listing.categorySlugs) {
      const categoryId = categoryBySlug.get(slug);
      if (categoryId) {
        await db.insert(listingCategories).values({
          listingId: listing.id,
          categoryId,
        });
        categoryAssignments++;
      }
    }
  }
  console.log(`    ${categoryAssignments} listing-category assignments created`);

  // 4e. Seed SKUs
  console.log('  Seeding SKUs...');
  let skuCount = 0;
  for (let i = 0; i < insertedListings.length; i++) {
    const listingSkus = seedSkusByListing[i];
    for (const sku of listingSkus) {
      await db.insert(inventorySkus).values({
        listingId: insertedListings[i].id,
        name: sku.name,
        description: sku.description,
        upc: sku.upc,
        size: sku.size,
        casePack: sku.casePack,
        price: sku.price,
        msrp: sku.msrp,
        quantity: sku.quantity,
        expirationDate: sku.expirationDate,
      });
      skuCount++;
    }
  }
  console.log(`    ${skuCount} SKUs created`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log(`\n--- Seed Complete ---`);
  console.log(`  Companies: ${insertedCompanies.length}`);
  console.log(`  Users: ${usersCreated}`);
  console.log(`  Categories: ${insertedCategories.length}`);
  console.log(`  Brands: ${insertedBrands.length}`);
  console.log(`  Listings: ${insertedListings.length}`);
  console.log(`  SKUs: ${skuCount}`);
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
