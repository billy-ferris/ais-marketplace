import { useUser } from '@clerk/react';
import { ShoppingBag, ClipboardList, Handshake } from 'lucide-react';
import { ComingSoonCard } from '@/components/shared/ComingSoonCard';

export function RetailerDashboard() {
  const { user } = useUser();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Retailer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName ?? 'Retailer'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ComingSoonCard
          title="Shop Inventory"
          description="Browse available CPG inventory by brand and category"
          icon={ShoppingBag}
        />
        <ComingSoonCard
          title="My Orders"
          description="View your purchase history and order status"
          icon={ClipboardList}
        />
        <ComingSoonCard
          title="My Offers"
          description="Track your submitted offers and negotiations"
          icon={Handshake}
        />
      </div>
    </div>
  );
}
