import type { ReactNode } from 'react';
import type { UserRole } from '@ais/shared';
import { useRole } from '@/hooks/useRole';
import { ForbiddenPage } from '@/pages/ForbiddenPage';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { role, isLoading } = useRole();

  if (isLoading) {
    return null;
  }

  if (!role || !allowedRoles.includes(role)) {
    return fallback ?? <ForbiddenPage />;
  }

  return <>{children}</>;
}
