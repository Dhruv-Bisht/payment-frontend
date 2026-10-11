import { sessionStore } from './session';

// Empty base URL = same origin (Vite proxy in dev, nginx in Docker). Set VITE_API_URL when hosted apart.
const BASE: string = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public readonly status: number, // 0 = the server could not be reached
    public readonly code: string | undefined,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

interface Options {
  method?: 'GET' | 'POST';
  body?: unknown;
  auth?: boolean;
}

export async function request<T>(path: string, { method = 'GET', body, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = sessionStore.get()?.token;
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.');
  }

  const text = await res.text();
  let data: { code?: string; message?: string } | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON body */
  }

  if (!res.ok) {
    if (res.status === 401 && auth) onUnauthorized?.();
    throw new ApiError(res.status, data?.code, data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

/**
 * Is it safe to automatically resend a PAYMENT after this failure? Yes only because every payment
 * carries an idempotency key: the server applies a given key at most once and replays the original
 * result. Without that guarantee, auto-retrying a write would risk paying twice.
 */
export const isRetrySafe = (e: unknown) =>
  e instanceof ApiError && (e.status === 0 || [502, 503, 504].includes(e.status) || e.code === 'CONCURRENT_UPDATE');

/** Reads can be retried on transient failures freely. */
export const shouldRetryQuery = (count: number, e: unknown) =>
  count < 2 && e instanceof ApiError && (e.status === 0 || e.status >= 500);

/** Plain-text endpoint (the Prometheus metrics page). Same auth and 401 handling as `request`. */
export async function requestText(path: string): Promise<string> {
  const token = sessionStore.get()?.token;
  let res: Response;
  try {
    res = await fetch(BASE + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.');
  }
  if (!res.ok) {
    if (res.status === 401) onUnauthorized?.();
    throw new ApiError(res.status, undefined, `Request failed (${res.status})`);
  }
  return res.text();
}
