import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { type PaginationState, type SortingState } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';
import { getListingColumns } from '@/components/manage/columns/listing-columns';
import {
  useListings,
  useDeleteListing,
  useSubmitForReview,
  useArchiveListing,
  type ListingRow,
} from '@/hooks/useListings';
import { useDebounce } from '@/hooks/useDebounce';
import { useRole } from '@/hooks/useRole';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'sold_out', label: 'Sold Out' },
  { value: 'archived', label: 'Archived' },
];

export function ListingsPage() {
  const navigate = useNavigate();
  const { isManufacturer } = useRole();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('all');

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<ListingRow | null>(null);
  const deleteListing = useDeleteListing();
  const submitForReview = useSubmitForReview();
  const archiveListing = useArchiveListing();

  const { data, isLoading } = useListings({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const handleEdit = useCallback(
    (listing: ListingRow) => {
      navigate(`/manage/listings/${listing.id}/edit`);
    },
    [navigate],
  );

  const handleView = useCallback(
    (listing: ListingRow) => {
      navigate(`/manage/listings/${listing.id}`);
    },
    [navigate],
  );

  const handleDelete = useCallback((listing: ListingRow) => {
    setDeleteTarget(listing);
  }, []);

  const handleSubmitForReview = useCallback(
    (listing: ListingRow) => {
      submitForReview.mutate(listing.id);
    },
    [submitForReview],
  );

  const handleArchive = useCallback(
    (listing: ListingRow) => {
      archiveListing.mutate(listing.id);
    },
    [archiveListing],
  );

  const columns = useMemo(
    () =>
      getListingColumns({
        onEdit: handleEdit,
        onView: handleView,
        onDelete: handleDelete,
        onSubmitForReview: isManufacturer ? handleSubmitForReview : undefined,
        onArchive: isManufacturer ? handleArchive : undefined,
        isManufacturer,
      }),
    [handleEdit, handleView, handleDelete, handleSubmitForReview, handleArchive, isManufacturer],
  );

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteListing.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Inventory Listings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage inventory listings and SKUs
          </p>
        </div>
        <Button onClick={() => navigate('/manage/listings/new')}>
          <Plus className="size-4" />
          Create Listing
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(val) => {
            if (val !== null) {
              setStatusFilter(val as string);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              {STATUS_FILTERS.find((sf) => sf.value === statusFilter)?.label ?? 'All Statuses'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((sf) => (
              <SelectItem key={sf.value} value={sf.value}>
                {sf.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Listing"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all associated SKUs. This action can be undone by an administrator.`}
        onConfirm={handleConfirmDelete}
        isPending={deleteListing.isPending}
      />
    </div>
  );
}
