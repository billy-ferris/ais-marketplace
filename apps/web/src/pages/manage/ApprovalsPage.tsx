import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { type PaginationState, type SortingState } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { getApprovalColumns } from '@/components/manage/columns/approval-columns';
import {
  useListings,
  useApproveListing,
  useRejectListing,
  type ListingRow,
} from '@/hooks/useListings';

export function ApprovalsPage() {
  const navigate = useNavigate();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Reject dialog state
  const [rejectTarget, setRejectTarget] = useState<ListingRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useListings({
    status: 'pending_approval',
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const approveListing = useApproveListing();
  const rejectListing = useRejectListing();

  const handleApprove = useCallback(
    (id: number) => {
      approveListing.mutate(id);
    },
    [approveListing],
  );

  const handleReject = useCallback((listing: ListingRow) => {
    setRejectTarget(listing);
    setRejectReason('');
  }, []);

  const handleEdit = useCallback(
    (id: number) => {
      navigate(`/manage/listings/${id}/edit`);
    },
    [navigate],
  );

  const handleConfirmReject = useCallback(() => {
    if (!rejectTarget || !rejectReason.trim()) return;
    rejectListing.mutate(
      { id: rejectTarget.id, reason: rejectReason.trim() },
      {
        onSuccess: () => {
          setRejectTarget(null);
          setRejectReason('');
        },
      },
    );
  }, [rejectTarget, rejectReason, rejectListing]);

  const columns = useMemo(
    () =>
      getApprovalColumns({
        onApprove: handleApprove,
        onReject: handleReject,
        onEdit: handleEdit,
      }),
    [handleApprove, handleReject, handleEdit],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
        <p className="text-sm text-muted-foreground">
          Review manufacturer-submitted listings
        </p>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        pageCount={data?.pagination.pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
      />

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRejectTarget(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting "{rejectTarget?.name}". The
              manufacturer will see this reason and can edit and resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection Reason *</Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why this listing is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!rejectReason.trim() || rejectListing.isPending}
            >
              {rejectListing.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
