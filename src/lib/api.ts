import { getAccessToken } from './auth';
import { API_URL } from './config';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function emitRequestEvent(type: 'start' | 'end' | 'error', message?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('watchapp:request', {
      detail: { type, message },
    }),
  );
}

export async function apiRequest<T>(
  path: string,
  method: Method = 'GET',
  body?: unknown,
  auth = false,
  options?: { suppressErrorToast?: boolean; suppressLoadingIndicator?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  if (!options?.suppressLoadingIndicator) {
    emitRequestEvent('start');
  }
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const err = (await res.json()) as { message?: string | string[] };
        if (Array.isArray(err.message) && err.message.length > 0) {
          message = err.message.join(', ');
        } else if (typeof err.message === 'string' && err.message) {
          message = err.message;
        }
      } catch {
        // no-op
      }
      if (!options?.suppressErrorToast) {
        emitRequestEvent('error', message);
      }
      throw new ApiError(message, res.status);
    }

    return (await res.json()) as T;
  } finally {
    if (!options?.suppressLoadingIndicator) {
      emitRequestEvent('end');
    }
  }
}

export async function apiFormRequest<T>(
  path: string,
  method: Method,
  formData: FormData,
  auth = false,
  options?: { suppressErrorToast?: boolean; suppressLoadingIndicator?: boolean },
): Promise<T> {
  const headers: Record<string, string> = {};
  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  if (!options?.suppressLoadingIndicator) {
    emitRequestEvent('start');
  }
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: formData,
      cache: 'no-store',
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const err = (await res.json()) as { message?: string | string[] };
        if (Array.isArray(err.message) && err.message.length > 0) {
          message = err.message.join(', ');
        } else if (typeof err.message === 'string' && err.message) {
          message = err.message;
        }
      } catch {
        // no-op
      }
      if (!options?.suppressErrorToast) {
        emitRequestEvent('error', message);
      }
      throw new ApiError(message, res.status);
    }

    return (await res.json()) as T;
  } finally {
    if (!options?.suppressLoadingIndicator) {
      emitRequestEvent('end');
    }
  }
}
