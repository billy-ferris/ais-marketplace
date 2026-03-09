import { useState, useMemo, useCallback } from 'react';
import { type PaginationState, type SortingState } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';
import { CategoryDialog } from '@/components/manage/CategoryDialog';
import { getCategoryColumns } from '@/components/manage/columns/category-columns';
import {
  useCategories,
  useDeleteCategory,
  type CategoryRow,
} from '@/hooks/useCategories';
import { useDebounce } from '@/hooks/useDebounce';

export function CategoriesPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryRow | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null);
  const deleteCategory = useDeleteCategory();

  const { data, isLoading } = useCategories({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const handleEdit = useCallback((category: CategoryRow) => {
    setEditCategory(category);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((category: CategoryRow) => {
    setDeleteTarget(category);
  }, []);

  const columns = useMemo(
    () => getCategoryColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  );

  function handleCreate() {
    setEditCategory(null);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditCategory(null);
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Add Category
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="pl-8"
        />
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

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        category={editCategory}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action can be undone by an administrator.`}
        onConfirm={handleConfirmDelete}
        isPending={deleteCategory.isPending}
      />
    </div>
  );
}
