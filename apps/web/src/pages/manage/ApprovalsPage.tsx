import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { type PaginationState, type SortingState } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { getApprovalColumns } from '@/components/manage/columns/approval-columns';
import { useListings } from '@/hooks/useListings';

export function ApprovalsPage() {
  const navigate = useNavigate();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useListings({
    status: 'pending_approval',
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const handleReview = useCallback(
    (id: number) => {
      navigate(`/manage/approvals/${id}`);
    },
    [navigate],
  );

  const columns = useMemo(
    () => getApprovalColumns({ onReview: handleReview }),
    [handleReview],
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
    </div>
  );
}
