import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { asc, eq, inArray } from 'drizzle-orm';
import { brandListingImages } from '../src/db/schema/brand-listing-images';

/**
 * One-off data-cleanup script (02.4-04 Task 2 / Pitfall 1).
 *
 * The PATCH image path never enforced the single-primary invariant, so
 * `brand_listing_images` may hold more than one `is_primary = true` row per
 * `listing_id`. The partial unique index
 * `brand_listing_images_one_primary_per_listing` (created by db:push in Task 3)
 * would abort with a duplicate-key violation against such dirty data.
 *
 * This script keeps exactly one survivor per offending listing — the row with
 * the lowest `display_order`, tie-broken by the lowest `id` — and sets
 * `is_primary = false` on every other primary for that listing. It MUST run
 * before the db:push in Task 3.
 */
async function main(): Promise<void> {
  const db = drizzle(process.env.DATABASE_URL!);

  // Fetch all primary rows, deterministically ordered so the first row per
  // listing is the survivor (lowest display_order, then lowest id).
  const primaries = await db
    .select({
      id: brandListingImages.id,
      listingId: brandListingImages.listingId,
      displayOrder: brandListingImages.displayOrder,
    })
    .from(brandListingImages)
    .where(eq(brandListingImages.isPrimary, true))
    .orderBy(
      asc(brandListingImages.listingId),
      asc(brandListingImages.displayOrder),
      asc(brandListingImages.id),
    );

  const byListing = new Map<number, typeof primaries>();
  for (const row of primaries) {
    const arr = byListing.get(row.listingId) ?? [];
    arr.push(row);
    byListing.set(row.listingId, arr);
  }

  const offending = [...byListing.entries()].filter(
    ([, rows]) => rows.length > 1,
  );
  console.log(
    `[dedup] Listings with >1 primary image before: ${offending.length}`,
  );

  const idsToDemote: number[] = [];
  for (const [, rows] of offending) {
    // rows[0] is the survivor (lowest display_order, then lowest id); demote the rest.
    for (const row of rows.slice(1)) idsToDemote.push(row.id);
  }

  if (idsToDemote.length > 0) {
    await db
      .update(brandListingImages)
      .set({ isPrimary: false })
      .where(inArray(brandListingImages.id, idsToDemote));
    console.log(
      `[dedup] Demoted ${idsToDemote.length} duplicate primary row(s) to is_primary=false`,
    );
  } else {
    console.log('[dedup] No duplicate primaries found; nothing to demote');
  }

  // Post-run verification: no listing may retain more than one primary.
  const after = await db
    .select({ listingId: brandListingImages.listingId })
    .from(brandListingImages)
    .where(eq(brandListingImages.isPrimary, true));
  const counts = new Map<number, number>();
  for (const row of after) {
    counts.set(row.listingId, (counts.get(row.listingId) ?? 0) + 1);
  }
  const stillOffending = [...counts.values()].filter((c) => c > 1).length;
  console.log(
    `[dedup] Listings with >1 primary image after: ${stillOffending}`,
  );

  if (stillOffending > 0) {
    console.error(
      '[dedup] FAILED: some listings still have multiple primaries',
    );
    process.exit(1);
  }
  console.log('[dedup] OK: zero listings with >1 primary image');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
