import { useState, useCallback } from 'react';
import { API_URL } from "./constants";

type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH';

interface ApiCallOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
}

interface ApiResponse<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: (options?: ApiCallOptions) => Promise<T>;
}

const useApiCall = <T>(endpoint: string): ApiResponse<T> => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (options: ApiCallOptions = {}): Promise<T> => {
    const {
      method = 'GET',
      headers = {},
      body
    } = options;

    setIsLoading(true);
    setError(null);

    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_URL}${endpoint}`, requestOptions);

      if (!response.ok) {
        throw new Error(`Failed to ${method} ${endpoint}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  return { data, isLoading, error, execute };
};

export const useCanvasConnect = () => useApiCall<{ success: boolean, message: string }>('/auth/canvas/connect');
export const useGoogleConnect = () => useApiCall<{ connected: boolean }>('/auth/google/connect');

// Example of how to add more API calls:
// export const useFetchUserProfile = () => useApiCall<UserProfile>('/user/profile');
// export const useUpdateUserProfile = () => useApiCall<UserProfile>('/user/profile');
// export const useDeleteUser = () => useApiCall<void>('/user');
