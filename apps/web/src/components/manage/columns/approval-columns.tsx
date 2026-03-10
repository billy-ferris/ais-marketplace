import { type ColumnDef } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ListingRow } from '@/hooks/useListings';

interface ApprovalColumnCallbacks {
  onReview: (id: number) => void;
}

export function getApprovalColumns({
  onReview,
}: ApprovalColumnCallbacks): ColumnDef<ListingRow, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Listing Name',
      enableSorting: true,
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left font-medium text-primary hover:underline"
          onClick={() => onReview(row.original.id)}
        >
          {row.original.name}
        </button>
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
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReview(row.original.id)}
        >
          <Eye className="size-4" />
          Review
        </Button>
      ),
    },
  ];
}
