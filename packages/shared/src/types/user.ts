export const UserRole = {
  ADMIN: 'admin',
  MANUFACTURER: 'manufacturer',
  RETAILER: 'retailer',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: number;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  companyId: number | null;
  createdAt: Date;
  updatedAt: Date;
}
