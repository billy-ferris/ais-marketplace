import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, getApiErrorMessage } from '@/lib/api';
import { API_ROUTES } from '@ais/shared';
import type { CreateBrandInput, UpdateBrandInput } from '@ais/shared';

export interface BrandRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  companyId: number;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BrandsResponse {
  data: BrandRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export function useBrands(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['brands', 'list', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      return apiFetch<BrandsResponse>(
        `${API_ROUTES.BRANDS}${qs ? `?${qs}` : ''}`,
      );
    },
  });
}

export function useBrand(id: number | null) {
  return useQuery({
    queryKey: ['brands', 'detail', id],
    queryFn: () => apiFetch<BrandRow>(`${API_ROUTES.BRANDS}/${id}`),
    enabled: id !== null && id !== undefined,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBrandInput) =>
      apiFetch(API_ROUTES.BRANDS, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created');
    },
    onError: (error: Error) => {
      toast.error(getApiErrorMessage(error, 'Failed to create brand'));
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBrandInput & { id: number }) =>
      apiFetch(`${API_ROUTES.BRANDS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand updated');
    },
    onError: (error: Error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update brand'));
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${API_ROUTES.BRANDS}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deleted');
    },
    onError: (error: Error) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete brand'));
    },
  });
}
