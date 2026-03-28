import { clearAccessToken, getAccessToken, setAccessToken } from './auth';
import { API_URL } from './config';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  suppressErrorToast?: boolean;
  suppressLoadingIndicator?: boolean;
};

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

let refreshInFlight: Promise<string | null> | null = null;

async function parseError(res: Response) {
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
  return message;
}

export async function refreshAccessToken() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) {
      clearAccessToken();
      return null;
    }

    const data = (await res.json()) as { accessToken?: string };
    const token = typeof data?.accessToken === 'string' ? data.accessToken : null;
    if (!token) {
      clearAccessToken();
      return null;
    }

    setAccessToken(token);
    return token;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

async function doJsonRequest<T>(
  path: string,
  method: Method,
  body: unknown,
  auth: boolean,
  options: RequestOptions | undefined,
  didRetry: boolean,
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

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    if (auth && res.status === 401 && !didRetry && path !== '/auth/refresh') {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return doJsonRequest<T>(path, method, body, auth, options, true);
      }
    }

    const message = await parseError(res);
    if (!options?.suppressErrorToast) {
      emitRequestEvent('error', message);
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

async function doFormRequest<T>(
  path: string,
  method: Method,
  formData: FormData,
  auth: boolean,
  options: RequestOptions | undefined,
  didRetry: boolean,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: formData,
    cache: 'no-store',
  });

  if (!res.ok) {
    if (auth && res.status === 401 && !didRetry && path !== '/auth/refresh') {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return doFormRequest<T>(path, method, formData, auth, options, true);
      }
    }

    const message = await parseError(res);
    if (!options?.suppressErrorToast) {
      emitRequestEvent('error', message);
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

export async function apiRequest<T>(
  path: string,
  method: Method = 'GET',
  body?: unknown,
  auth = false,
  options?: RequestOptions,
): Promise<T> {
  if (!options?.suppressLoadingIndicator) {
    emitRequestEvent('start');
  }
  try {
    return await doJsonRequest<T>(path, method, body, auth, options, false);
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
  options?: RequestOptions,
): Promise<T> {
  if (!options?.suppressLoadingIndicator) {
    emitRequestEvent('start');
  }
  try {
    return await doFormRequest<T>(path, method, formData, auth, options, false);
  } finally {
    if (!options?.suppressLoadingIndicator) {
      emitRequestEvent('end');
    }
  }
}
