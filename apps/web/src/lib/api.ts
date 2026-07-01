export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Structured error thrown by apiFetch on a non-ok response.
 * Carries the server's Zod flatten() shape so callers can surface real
 * validation messages (toast now, field-level mapping later).
 */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string[]>;
  formErrors: string[];

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
    formErrors: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.formErrors = formErrors;
  }
}

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  tokenGetter = fn;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const token = await tokenGetter?.();

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body?.error ??
      body?.formErrors?.[0] ??
      `API error: ${response.status} ${response.statusText}`;
    throw new ApiError(
      message,
      response.status,
      body?.fieldErrors ?? {},
      body?.formErrors ?? [],
    );
  }

  return response.json() as Promise<T>;
}
