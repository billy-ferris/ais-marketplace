export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
}
