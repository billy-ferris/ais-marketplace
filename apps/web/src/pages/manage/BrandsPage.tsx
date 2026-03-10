import { useState, useMemo, useCallback } from 'react';
import { type PaginationState, type SortingState } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog';
import { BrandDialog } from '@/components/manage/BrandDialog';
import { getBrandColumns } from '@/components/manage/columns/brand-columns';
import { useBrands, useDeleteBrand, type BrandRow } from '@/hooks/useBrands';
import { useDebounce } from '@/hooks/useDebounce';
import { useRole } from '@/hooks/useRole';

export function BrandsPage() {
  const { isManufacturer } = useRole();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandRow | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<BrandRow | null>(null);
  const deleteBrand = useDeleteBrand();

  const { data, isLoading } = useBrands({
    search: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const handleEdit = useCallback((brand: BrandRow) => {
    setEditBrand(brand);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((brand: BrandRow) => {
    setDeleteTarget(brand);
  }, []);

  const columns = useMemo(
    () => getBrandColumns({ onEdit: handleEdit, onDelete: handleDelete, isManufacturer }),
    [handleEdit, handleDelete, isManufacturer],
  );

  function handleCreate() {
    setEditBrand(null);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditBrand(null);
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteBrand.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-sm text-muted-foreground">
            Manage brands and manufacturers
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          Add Brand
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search brands..."
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

      <BrandDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        brand={editBrand}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Brand"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action can be undone by an administrator.`}
        onConfirm={handleConfirmDelete}
        isPending={deleteBrand.isPending}
      />
    </div>
  );
}
