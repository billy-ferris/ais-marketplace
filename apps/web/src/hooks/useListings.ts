import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { API_ROUTES } from '@ais/shared';

export interface ListingCategory {
  id: number;
  name: string;
}

export interface ListingRow {
  id: number;
  name: string;
  description: string | null;
  brandId: number;
  brandName: string | null;
  status: string;
  rejectionReason: string | null;
  skuCount: number;
  categories: ListingCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface ListingImage {
  id: number;
  listingId: number;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface ListingSku {
  id: number;
  listingId: number;
  name: string;
  sku: string | null;
  upc: string | null;
  size: string | null;
  casePack: number | null;
  casesPerPallet: number | null;
  price: string;
  msrp: string;
  quantity: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListingDetail {
  id: number;
  name: string;
  description: string | null;
  brandId: number;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  brand: {
    id: number;
    name: string;
    company: {
      id: number;
      name: string;
    };
  };
  inventorySkus: ListingSku[];
  brandListingImages: ListingImage[];
  categories: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }[];
}

interface ListingsResponse {
  data: ListingRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

export function useListings(params?: {
  search?: string;
  status?: string;
  brandId?: number;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['listings', 'list', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set('search', params.search);
      if (params?.status) searchParams.set('status', params.status);
      if (params?.brandId) searchParams.set('brandId', String(params.brandId));
      if (params?.page) searchParams.set('page', String(params.page));
      if (params?.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      return apiFetch<ListingsResponse>(
        `${API_ROUTES.LISTINGS}${qs ? `?${qs}` : ''}`,
      );
    },
  });
}

export function useListing(id: number | null) {
  return useQuery({
    queryKey: ['listings', 'detail', id],
    queryFn: () => apiFetch<ListingDetail>(`${API_ROUTES.LISTINGS}/${id}`),
    enabled: id !== null && id !== undefined && !Number.isNaN(id),
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch(API_ROUTES.LISTINGS, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create listing');
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & Record<string, unknown>) =>
      apiFetch(`${API_ROUTES.LISTINGS}/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update listing');
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${API_ROUTES.LISTINGS}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete listing');
    },
  });
}

export function useSubmitForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${API_ROUTES.LISTINGS}/${id}/submit`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing submitted for review');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit listing for review');
    },
  });
}

export function useApproveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${API_ROUTES.LISTINGS}/${id}/approve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing approved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve listing');
    },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiFetch(`${API_ROUTES.LISTINGS}/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject listing');
    },
  });
}

export function useRevertToDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${API_ROUTES.LISTINGS}/${id}/revert-to-draft`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing reverted to draft');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revert listing to draft');
    },
  });
}

export function useArchiveListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`${API_ROUTES.LISTINGS}/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing archived');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive listing');
    },
  });
}
