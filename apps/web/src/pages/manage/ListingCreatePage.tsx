import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingForm } from '@/components/manage/ListingForm';
import { useCreateListing, useSubmitForReview } from '@/hooks/useListings';
import { useRole } from '@/hooks/useRole';

export function ListingCreatePage() {
  const navigate = useNavigate();
  const createListing = useCreateListing();
  const submitForReview = useSubmitForReview();
  const { isManufacturer } = useRole();
  const submitForReviewAfterCreate = useRef(false);

  const handleSubmit = useCallback(
    (payload: Record<string, unknown>) => {
      const shouldSubmit = submitForReviewAfterCreate.current;
      submitForReviewAfterCreate.current = false;

      createListing.mutate(payload, {
        onSuccess: (data: unknown) => {
          if (shouldSubmit && data && typeof data === 'object' && 'id' in data) {
            submitForReview.mutate((data as { id: number }).id, {
              onSuccess: () => navigate('/manage/listings'),
              onError: () => navigate('/manage/listings'),
            });
          } else {
            navigate('/manage/listings');
          }
        },
      });
    },
    [createListing, submitForReview, navigate],
  );

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
          onSubmit={handleSubmit}
          isSubmitting={createListing.isPending || submitForReview.isPending}
          hideStatus={isManufacturer}
          extraActions={
            isManufacturer ? (
              <Button
                type="submit"
                variant="outline"
                disabled={createListing.isPending || submitForReview.isPending}
                onClick={() => {
                  submitForReviewAfterCreate.current = true;
                }}
              >
                <Send className="size-4" />
                Submit for Review
              </Button>
            ) : undefined
          }
          submitLabel={isManufacturer ? 'Save as Draft' : 'Create Listing'}
        />
      </div>
    </div>
  );
}
