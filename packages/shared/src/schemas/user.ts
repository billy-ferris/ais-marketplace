import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  role: z.enum(['admin', 'manufacturer', 'retailer']),
  companyId: z.number().int().positive().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
