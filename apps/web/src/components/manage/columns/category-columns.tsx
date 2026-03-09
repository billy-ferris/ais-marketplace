import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CategoryRow } from '@/hooks/useCategories';

interface CategoryColumnCallbacks {
  onEdit: (category: CategoryRow) => void;
  onDelete: (category: CategoryRow) => void;
}

export function getCategoryColumns({
  onEdit,
  onDelete,
}: CategoryColumnCallbacks): ColumnDef<CategoryRow, unknown>[] {
  return [
    {
      accessorKey: 'icon',
      header: 'Icon',
      enableSorting: false,
      cell: ({ row }) => {
        const icon = row.original.icon;
        return icon ? (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {icon}
          </code>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
    },
    {
      accessorKey: 'displayOrder',
      header: 'Order',
      enableSorting: true,
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
        const category = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" />
              }
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(category)}
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
