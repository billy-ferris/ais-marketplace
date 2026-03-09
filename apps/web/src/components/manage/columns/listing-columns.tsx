import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  sold_out: 'Sold Out',
  archived: 'Archived',
};

interface ListingColumnCallbacks {
  onEdit: (listing: ListingRow) => void;
  onDelete: (listing: ListingRow) => void;
}

export function getListingColumns({
  onEdit,
  onDelete,
}: ListingColumnCallbacks): ColumnDef<ListingRow, unknown>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left font-medium text-primary hover:underline"
          onClick={() => onEdit(row.original)}
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
      enableSorting: true,
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={STATUS_VARIANT[status] ?? 'secondary'}>
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
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(listing)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
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
