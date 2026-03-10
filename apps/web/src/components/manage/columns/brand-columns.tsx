import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImagePlaceholder } from '@/components/shared/ImagePlaceholder';
import type { BrandRow } from '@/hooks/useBrands';

interface BrandColumnCallbacks {
  onEdit: (brand: BrandRow) => void;
  onDelete: (brand: BrandRow) => void;
  isManufacturer?: boolean;
}

export function getBrandColumns({
  onEdit,
  onDelete,
  isManufacturer,
}: BrandColumnCallbacks): ColumnDef<BrandRow, unknown>[] {
  return [
    {
      accessorKey: 'logoUrl',
      header: 'Logo',
      enableSorting: false,
      cell: ({ row }) => {
        const logoUrl = row.original.logoUrl;
        return logoUrl ? (
          <img
            src={logoUrl}
            alt={row.original.name}
            className="size-8 rounded-md object-cover"
          />
        ) : (
          <ImagePlaceholder className="size-8" iconSize={14} />
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      enableSorting: false,
      meta: { cellClassName: 'max-w-0 w-full' },
      cell: ({ row }) => {
        const desc = row.original.description;
        if (!desc) return <span className="text-muted-foreground">-</span>;
        return (
          <p className="truncate" title={desc}>
            {desc}
          </p>
        );
      },
    },
    ...(!isManufacturer ? [{
      accessorKey: 'companyName',
      header: 'Company',
      enableSorting: true,
      cell: ({ row }: { row: { original: BrandRow } }) => row.original.companyName ?? '-',
    }] : []),
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
        const brand = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(brand)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(brand)}
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
