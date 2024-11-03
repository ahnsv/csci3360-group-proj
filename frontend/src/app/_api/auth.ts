import { useState, useCallback } from 'react';
import { API_URL } from "./constants";
import { error } from 'console';

type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH';

interface ApiCallOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
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
export const useRequiredIntegrations = () => useApiCall<{ google: boolean, canvas: boolean }>('/auth/required-integrations');

type Task = {
  id: number;
  created_at: string;
  name: string;
  description?: string;
  user_id: string;
  start_at?: string;
  end_at?: string;
  due_at?: string;
  link?: string;
  type?: string;
}

export const useGetTasks = () => useApiCall<Task[]>('/task');
