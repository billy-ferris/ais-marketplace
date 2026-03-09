import { z } from 'zod';

export const createSkuSchema = z.object({
  name: z.string().min(1, 'SKU name is required').max(255),
  sku: z.string().max(100).optional(),
  upc: z.string().max(20).optional(),
  size: z.string().max(100).optional(),
  casePack: z.number().int().positive().optional(),
  casesPerPallet: z.number().int().positive().optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Must be a decimal number (e.g., "12.99")'),
  msrp: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Must be a decimal number (e.g., "24.99")'),
  quantity: z.number().int().nonnegative(),
  imageUrl: z.string().url().max(1024).optional(),
});

export const updateSkuSchema = createSkuSchema.partial();

export type CreateSkuInput = z.infer<typeof createSkuSchema>;
export type UpdateSkuInput = z.infer<typeof updateSkuSchema>;
