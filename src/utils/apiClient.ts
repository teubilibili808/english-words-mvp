import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/api';

const AUTH_TOKEN_KEY = 'auth_token';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  withAuth?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, withAuth = true } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (withAuth) {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export function apiGet<T>(path: string, withAuth = true) {
  return apiRequest<T>(path, { method: 'GET', withAuth });
}

export function apiPost<T>(path: string, body: unknown, withAuth = true) {
  return apiRequest<T>(path, { method: 'POST', body, withAuth });
}

export function apiPatch<T>(path: string, body: unknown, withAuth = true) {
  return apiRequest<T>(path, { method: 'PATCH', body, withAuth });
}
