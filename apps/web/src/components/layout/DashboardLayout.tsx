import { useRole } from '@/hooks/useRole';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { ManufacturerDashboard } from '@/pages/ManufacturerDashboard';
import { RetailerDashboard } from '@/pages/RetailerDashboard';

export function DashboardLayout() {
  const { role, isAdmin, isManufacturer, isRetailer, isLoading } = useRole();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (isAdmin) return <AdminDashboard />;
  if (isManufacturer) return <ManufacturerDashboard />;
  if (isRetailer) return <RetailerDashboard />;

  return (
    <div className="text-center py-12">
      <h2 className="text-lg font-semibold text-foreground">No Role Assigned</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your account does not have a role assigned yet. Please contact an administrator.
      </p>
    </div>
  );
}
