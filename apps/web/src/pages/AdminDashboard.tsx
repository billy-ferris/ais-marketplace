import { useUser } from '@clerk/react';
import { Package, Tag, Users, BarChart3, Building2 } from 'lucide-react';
import { ComingSoonCard } from '@/components/shared/ComingSoonCard';

export function AdminDashboard() {
  const { user } = useUser();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName ?? 'Admin'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ComingSoonCard
          title="Inventory Management"
          description="Create, edit, and manage inventory listings"
          icon={Package}
        />
        <ComingSoonCard
          title="Brand & Category Management"
          description="Organize products by brand and category"
          icon={Tag}
        />
        <ComingSoonCard
          title="Account Management"
          description="Manage companies, users, and account settings"
          icon={Building2}
        />
        <ComingSoonCard
          title="Offer Dashboard"
          description="Monitor all offers and negotiations"
          icon={BarChart3}
        />
      </div>
    </div>
  );
}
