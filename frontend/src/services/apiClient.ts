import { ApiErrorResponse } from '../types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7193'; // Default backend URL

export class ApiError extends Error {
  public statusCode: number;
  public errors?: { field: string; message: string }[];

  constructor(message: string, statusCode: number, errors?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Get token from localStorage if in browser
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // No Content
    if (response.status === 204) {
      return {} as T;
    }

    if (!response.ok) {
      let errorMsg = 'An unexpected error occurred.';
      let errors = undefined;

      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          const errorData = (await response.json()) as ApiErrorResponse;
          if (errorData.message) {
            errorMsg = errorData.message;
          } else if (response.status === 401) {
            errorMsg = endpoint.includes('/login') ? 'Invalid email or password.' : 'Your session has expired. Please log in again.';
          } else if (response.status === 403) {
            errorMsg = 'You do not have permission to perform this action.';
          } else if (response.status === 404) {
            errorMsg = 'The requested resource was not found.';
          }
          errors = errorData.errors;
        } catch {
          // Ignore json parse error
        }
      } else {
        try {
          const textError = await response.text();
          if (textError) {
            errorMsg = textError;
          } else if (response.status === 401) {
            errorMsg = endpoint.includes('/login') ? 'Invalid email or password.' : 'Your session has expired. Please log in again.';
          } else if (response.status === 403) {
            errorMsg = 'You do not have permission to perform this action.';
          } else if (response.status === 404) {
            errorMsg = 'The requested resource was not found.';
          } else {
            errorMsg = response.statusText || 'Something went wrong. Please try again later.';
          }
        } catch {
          if (response.status === 401) {
            errorMsg = endpoint.includes('/login') ? 'Invalid email or password.' : 'Your session has expired. Please log in again.';
          }
        }
      }

      throw new ApiError(errorMsg, response.status, errors);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or unexpected
    throw new ApiError('Network error. Please check your connection.', 0);
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'PATCH', body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: 'DELETE' }),
};
