import { type ColumnDef } from '@tanstack/react-table';
import { Check, X, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ListingRow } from '@/hooks/useListings';

interface ApprovalColumnCallbacks {
  onApprove: (id: number) => void;
  onReject: (listing: ListingRow) => void;
  onEdit: (id: number) => void;
}

export function getApprovalColumns({
  onApprove,
  onReject,
  onEdit,
}: ApprovalColumnCallbacks): ColumnDef<ListingRow, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Listing Name',
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
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
      enableSorting: false,
      cell: () => (
        <Badge
          variant="outline"
          className="bg-amber-100 text-amber-800 border-amber-200"
        >
          Pending Approval
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Submitted',
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
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button
              size="sm"
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onApprove(listing.id)}
            >
              <Check className="size-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(listing)}
            >
              <X className="size-4" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit(listing.id)}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          </div>
        );
      },
    },
  ];
}
