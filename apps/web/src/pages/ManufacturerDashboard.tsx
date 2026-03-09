import { useUser } from '@clerk/react';
import { Package, Inbox, ClipboardList } from 'lucide-react';
import { ComingSoonCard } from '@/components/shared/ComingSoonCard';

export function ManufacturerDashboard() {
  const { user } = useUser();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Manufacturer Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName ?? 'Manufacturer'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ComingSoonCard
          title="My Inventory"
          description="View your inventory listings and their status"
          icon={Package}
        />
        <ComingSoonCard
          title="Incoming Offers"
          description="Review, accept, decline, or counter offers"
          icon={Inbox}
        />
        <ComingSoonCard
          title="Order History"
          description="Track confirmed orders"
          icon={ClipboardList}
        />
      </div>
    </div>
  );
}
