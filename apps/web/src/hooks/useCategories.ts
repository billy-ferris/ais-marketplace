import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api';
import { API_ROUTES } from '@ais/shared';
import type { CreateCategoryInput, UpdateCategoryInput } from '@ais/shared';

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesResponse {
  data: CategoryRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export function useCategories(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['categories', 'list', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      return apiFetch<CategoriesResponse>(
        `${API_ROUTES.CATEGORIES}${qs ? `?${qs}` : ''}`,
      );
    },
  });
}

export function useCategory(id: number | null) {
  return useQuery({
    queryKey: ['categories', 'detail', id],
    queryFn: () => apiFetch<CategoryRow>(`${API_ROUTES.CATEGORIES}/${id}`),
    enabled: id !== null && id !== undefined,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryInput) =>
      apiFetch(API_ROUTES.CATEGORIES, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
    },
    onError: (error: Error) => {
      const message =
        error instanceof ApiError && error.formErrors.length
          ? error.formErrors[0]
          : error.message || 'Failed to create category';
      toast.error(message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCategoryInput & { id: number }) =>
      apiFetch(`${API_ROUTES.CATEGORIES}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated');
    },
    onError: (error: Error) => {
      const message =
        error instanceof ApiError && error.formErrors.length
          ? error.formErrors[0]
          : error.message || 'Failed to update category';
      toast.error(message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${API_ROUTES.CATEGORIES}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (error: Error) => {
      const message =
        error instanceof ApiError && error.formErrors.length
          ? error.formErrors[0]
          : error.message || 'Failed to delete category';
      toast.error(message);
    },
  });
}
