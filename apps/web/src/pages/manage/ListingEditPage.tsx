import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ListingForm } from '@/components/manage/ListingForm';
import { useListing, useUpdateListing } from '@/hooks/useListings';

export function ListingEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listingId = Number(id);

  const { data: listing, isLoading, error } = useListing(
    Number.isNaN(listingId) ? null : listingId,
  );
  const updateListing = useUpdateListing();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="max-w-3xl space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/manage/listings')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Listing Not Found
          </h1>
        </div>
        <p className="text-muted-foreground">
          The listing you are looking for does not exist or has been deleted.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate('/manage/listings')}
        >
          Back to Listings
        </Button>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Edit Listing</h1>
          <p className="text-sm text-muted-foreground">
            Update "{listing.name}" listing details, SKUs, and images
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <ListingForm
          listing={listing}
          onSubmit={(payload) => {
            updateListing.mutate(
              { id: listingId, ...payload },
              {
                onSuccess: () => {
                  navigate('/manage/listings');
                },
              },
            );
          }}
          isSubmitting={updateListing.isPending}
        />
      </div>
    </div>
  );
}
