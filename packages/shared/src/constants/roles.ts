import { UserRole } from '../types/user.js';

export { UserRole } from '../types/user.js';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.MANUFACTURER]: 'Manufacturer',
  [UserRole.RETAILER]: 'Retailer',
};

export const ALL_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.MANUFACTURER,
  UserRole.RETAILER,
];
