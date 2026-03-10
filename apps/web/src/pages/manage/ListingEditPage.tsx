import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, AlertTriangle, Info, Send, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ListingForm } from '@/components/manage/ListingForm';
import {
  useListing,
  useUpdateListing,
  useSubmitForReview,
  useRevertToDraft,
} from '@/hooks/useListings';
import { useRole } from '@/hooks/useRole';

export function ListingEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listingId = Number(id);
  const { isManufacturer } = useRole();

  const { data: listing, isLoading, error } = useListing(
    Number.isNaN(listingId) ? null : listingId,
  );
  const updateListing = useUpdateListing();
  const submitForReview = useSubmitForReview();
  const revertToDraft = useRevertToDraft();

  const isPendingApproval = listing?.status === 'pending_approval';
  const isRejected = listing?.status === 'rejected';
  const isArchived = listing?.status === 'archived';
  const isDraftOrRejected =
    listing?.status === 'draft' || listing?.status === 'rejected';
  const isActive = listing?.status === 'active';
  const isReadOnly = isManufacturer && (isPendingApproval || isActive);

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

      <div className="max-w-3xl space-y-4">
        {isManufacturer && isRejected && listing.rejectionReason && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Listing Rejected</AlertTitle>
            <AlertDescription>
              {listing.rejectionReason}. Edit and resubmit for review.
            </AlertDescription>
          </Alert>
        )}

        {isManufacturer && isPendingApproval && (
          <Alert>
            <Info className="size-4" />
            <AlertTitle>Under Review</AlertTitle>
            <AlertDescription>
              This listing is under review and cannot be edited.
            </AlertDescription>
          </Alert>
        )}

        {isManufacturer && isActive && (
          <Alert>
            <Info className="size-4" />
            <AlertTitle>Active Listing</AlertTitle>
            <AlertDescription>
              This listing is active and cannot be edited. Archive it first if
              changes are needed.
            </AlertDescription>
          </Alert>
        )}

        {!isReadOnly && (
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
            hideStatus={isManufacturer}
            hideSubmit={isManufacturer && isArchived}
            extraActions={
              isManufacturer && (isDraftOrRejected || isArchived) ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      submitForReview.mutate(listingId, {
                        onSuccess: () => {
                          navigate('/manage/listings');
                        },
                      });
                    }}
                    disabled={submitForReview.isPending}
                  >
                    <Send className="size-4" />
                    Submit for Review
                  </Button>
                  {isArchived && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        revertToDraft.mutate(listingId, {
                          onSuccess: () => {
                            navigate('/manage/listings');
                          },
                        });
                      }}
                      disabled={revertToDraft.isPending}
                    >
                      <FileEdit className="size-4" />
                      Save as Draft
                    </Button>
                  )}
                </>
              ) : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
