const BASE_URL = '/api';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Los 4xx no se arreglan reintentando; red y 5xx sí. */
export function shouldRetry(failureCount: number, error: unknown) {
  if (isApiError(error) && error.status < 500) return false;
  return failureCount < 2;
}

/** Nest responde `{ message: string | string[], statusCode }`. */
async function readMessage(res: Response) {
  const fallback = 'No se pudo completar la operación';
  try {
    const data = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join('. ') || fallback;
    return data.message || fallback;
  } catch {
    return fallback;
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!res.ok) {
    throw new ApiError(res.status, await readMessage(res));
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
