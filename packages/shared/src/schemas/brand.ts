import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(255),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().max(1024).optional(),
  companyId: z.number().int().positive('Company is required').optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
