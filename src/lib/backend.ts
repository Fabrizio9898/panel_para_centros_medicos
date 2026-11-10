import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api/v1';

/** Server-only call to clinic-backend with the signed-in user's Clerk token. */
export async function backendFetch(path: string, init: RequestInit = {}) {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    return Response.json({ message: 'No autorizado' }, { status: 401 });
  }

  return fetch(`${API_URL}/${path.replace(/^\/+/, '')}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });
}
