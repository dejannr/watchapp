import { clearAccessToken, getAccessToken, setAccessToken } from './auth';
import { API_URL } from './config';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type RequestOptions = {
  suppressErrorToast?: boolean;
  suppressLoadingIndicator?: boolean;
};
const REQUEST_TIMEOUT_MS = 15000;

const ERROR_TRANSLATIONS: Record<string, string> = {
  'Email already in use': 'E-pošta je već zauzeta',
  'Slug already in use': 'Slug je već zauzet',
  'Invalid slug': 'Neispravan slug',
  'About must be between 20 and 1500 characters':
    'Biografija mora imati između 20 i 1500 karaktera',
  'City is required': 'Grad je obavezan',
  'Country is required': 'Država je obavezna',
  'Invalid city for selected country': 'Neispravan grad za izabranu državu',
  'Invalid credentials': 'Neispravni podaci za prijavu. Proverite e-poštu/lozinku i pokušajte ponovo.',
  'Invalid verification token': 'Neispravan verifikacioni token',
  'Invalid refresh token': 'Neispravan token za osvežavanje sesije',
  'Invalid reset token': 'Neispravan token za reset lozinke',
  'Invalid token subject': 'Neispravan token',
  'If account exists, reset email was sent': 'Ako nalog postoji, poslat je e-mail za reset lozinke',
  'Reset email prepared': 'E-mail za reset lozinke je pripremljen',
  'Password reset complete': 'Lozinka je uspešno resetovana',
  'Your account email has been successfully verified.': 'E-pošta naloga je uspešno verifikovana.',
  'email must be an email': 'Unesite ispravnu e-poštu',
  'password must be longer than or equal to 8 characters': 'Lozinka mora imati najmanje 8 karaktera',
  'password should not be empty': 'Lozinka je obavezna',
};

function toSerbianError(message: string) {
  return ERROR_TRANSLATIONS[message] ?? message;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function emitRequestEvent(type: 'start' | 'end' | 'error', message?: string, requestId?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('watchapp:request', {
      detail: { type, message, requestId },
    }),
  );
}

let refreshInFlight: Promise<string | null> | null = null;

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Zahtev je istekao. Pokušajte ponovo.', 408);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseError(res: Response) {
  let message = `HTTP ${res.status}`;
  try {
    const err = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(err.message) && err.message.length > 0) {
      message = err.message.map(toSerbianError).join(', ');
    } else if (typeof err.message === 'string' && err.message) {
      message = toSerbianError(err.message);
    }
  } catch {
    // no-op
  }
  return toSerbianError(message);
}

export async function refreshAccessToken() {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    let res: Response;
    try {
      res = await fetchWithTimeout(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
    } catch {
      clearAccessToken();
      return null;
    }
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

  const res = await fetchWithTimeout(`${API_URL}${path}`, {
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

  const res = await fetchWithTimeout(`${API_URL}${path}`, {
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
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  if (!options?.suppressLoadingIndicator) {
    emitRequestEvent('start', undefined, requestId);
  }
  try {
    return await doJsonRequest<T>(path, method, body, auth, options, false);
  } finally {
    if (!options?.suppressLoadingIndicator) {
      emitRequestEvent('end', undefined, requestId);
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
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  if (!options?.suppressLoadingIndicator) {
    emitRequestEvent('start', undefined, requestId);
  }
  try {
    return await doFormRequest<T>(path, method, formData, auth, options, false);
  } finally {
    if (!options?.suppressLoadingIndicator) {
      emitRequestEvent('end', undefined, requestId);
    }
  }
}
