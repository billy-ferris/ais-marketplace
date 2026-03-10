import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Eye, Trash2, Send, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ListingRow } from '@/hooks/useListings';

const STATUS_VARIANT: Record<
  string,
  'secondary' | 'default' | 'destructive' | 'outline'
> = {
  draft: 'secondary',
  active: 'default',
  sold_out: 'destructive',
  archived: 'outline',
  pending_approval: 'outline',
  rejected: 'destructive',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  sold_out: 'Sold Out',
  archived: 'Archived',
  pending_approval: 'Pending Approval',
  rejected: 'Rejected',
};

const STATUS_CLASS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending_approval: 'bg-amber-100 text-amber-800 border-amber-200',
};

interface ListingColumnCallbacks {
  onEdit: (listing: ListingRow) => void;
  onView: (listing: ListingRow) => void;
  onDelete: (listing: ListingRow) => void;
  onSubmitForReview?: (listing: ListingRow) => void;
  onArchive?: (listing: ListingRow) => void;
  isManufacturer?: boolean;
}

export function getListingColumns({
  onEdit,
  onView,
  onDelete,
  onSubmitForReview,
  onArchive,
  isManufacturer,
}: ListingColumnCallbacks): ColumnDef<ListingRow, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => {
        const isActive = row.original.status === 'active';
        return (
          <button
            type="button"
            className="text-left font-medium text-primary hover:underline"
            onClick={() => (isActive ? onView : onEdit)(row.original)}
          >
            {row.original.name}
          </button>
        );
      },
    },
    {
      accessorKey: 'brandName',
      header: 'Brand',
      enableSorting: true,
      cell: ({ row }) => row.original.brandName ?? '-',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={STATUS_VARIANT[status] ?? 'secondary'}
            className={STATUS_CLASS[status] ?? ''}
          >
            {STATUS_LABEL[status] ?? status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'skuCount',
      header: 'SKUs',
      enableSorting: true,
      cell: ({ row }) => row.original.skuCount,
    },
    {
      id: 'categories',
      header: 'Categories',
      enableSorting: false,
      cell: ({ row }) => {
        const cats = row.original.categories;
        if (!cats || cats.length === 0) return '-';
        return (
          <div className="flex flex-wrap gap-1">
            {cats.map((cat) => (
              <Badge key={cat.id} variant="outline" className="text-xs">
                {cat.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      enableSorting: true,
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const listing = row.original;
        const isActive = listing.status === 'active';
        const canSubmitForReview =
          isManufacturer &&
          onSubmitForReview &&
          (listing.status === 'draft' || listing.status === 'rejected');
        const canArchive =
          isManufacturer && onArchive && isActive;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isActive ? (
                <DropdownMenuItem onClick={() => onView(listing)}>
                  <Eye className="size-4" />
                  View
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onEdit(listing)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canSubmitForReview && (
                <DropdownMenuItem onClick={() => onSubmitForReview(listing)}>
                  <Send className="size-4" />
                  Submit for Review
                </DropdownMenuItem>
              )}
              {canArchive && (
                <DropdownMenuItem onClick={() => onArchive(listing)}>
                  <Archive className="size-4" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(listing)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
