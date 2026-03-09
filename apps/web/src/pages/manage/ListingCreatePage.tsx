import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingForm } from '@/components/manage/ListingForm';
import { useCreateListing } from '@/hooks/useListings';

export function ListingCreatePage() {
  const navigate = useNavigate();
  const createListing = useCreateListing();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate('/manage/listings')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create New Listing
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a new inventory listing with SKUs and images
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <ListingForm
          onSubmit={(payload) => {
            createListing.mutate(payload, {
              onSuccess: () => {
                navigate('/manage/listings');
              },
            });
          }}
          isSubmitting={createListing.isPending}
        />
      </div>
    </div>
  );
}
