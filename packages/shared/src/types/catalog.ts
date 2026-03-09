export const ListingStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  SOLD_OUT: 'sold_out',
  ARCHIVED: 'archived',
} as const;

export type ListingStatus = (typeof ListingStatus)[keyof typeof ListingStatus];

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  [ListingStatus.DRAFT]: 'Draft',
  [ListingStatus.ACTIVE]: 'Active',
  [ListingStatus.SOLD_OUT]: 'Sold Out',
  [ListingStatus.ARCHIVED]: 'Archived',
};

export interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface BrandListing {
  id: number;
  name: string;
  description: string | null;
  brandId: number;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface InventorySKU {
  id: number;
  listingId: number;
  name: string;
  sku: string | null;
  upc: string | null;
  size: string | null;
  casePack: number | null;
  casesPerPallet: number | null;
  price: string;
  msrp: string;
  quantity: number;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
