const API_BASE_URL = 'http://127.0.0.1:8000/api';

export interface ApiValidationErrors {
  [field: string]: string[];
}

export class ApiError extends Error {
  status: number;
  errors?: ApiValidationErrors;

  constructor(
    message: string,
    status: number,
    errors?: ApiValidationErrors,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',

      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      data?.message || `Request failed with status ${response.status}.`,
      response.status,
      data?.errors,
    );
  }

  return data as T;
}
