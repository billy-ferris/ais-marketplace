import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['manufacturer', 'retailer']),
  marginPercentage: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Must be a decimal number (e.g., "10.00")')
    .optional()
    .default('10.00'),
  contactName: z.string().min(1).max(255),
  phone: z.string().min(1).max(20),
  street: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z
    .string()
    .length(2, 'State must be exactly 2 characters')
    .optional(),
  zip: z.string().max(10).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
