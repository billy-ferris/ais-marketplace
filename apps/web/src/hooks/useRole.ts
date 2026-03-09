import { useUser } from '@clerk/react';
import { UserRole } from '@ais/shared';

export interface UseRoleResult {
  role: UserRole | null;
  isAdmin: boolean;
  isManufacturer: boolean;
  isRetailer: boolean;
  isLoading: boolean;
}

export function useRole(): UseRoleResult {
  const { user, isLoaded } = useUser();

  const role = (user?.publicMetadata?.role as UserRole) ?? null;

  return {
    role,
    isAdmin: role === UserRole.ADMIN,
    isManufacturer: role === UserRole.MANUFACTURER,
    isRetailer: role === UserRole.RETAILER,
    isLoading: !isLoaded,
  };
}
