import { z } from 'zod';

export const createListingSchema = z.object({
  name: z.string().min(1, 'Listing name is required').max(255),
  description: z.string().max(5000).optional(),
  brandId: z.number().int().positive('Brand is required'),
  status: z.enum(['draft', 'active', 'sold_out', 'archived']).optional().default('draft'),
  categoryIds: z.array(z.number().int().positive()).optional(),
});

export const updateListingSchema = createListingSchema.partial();

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
