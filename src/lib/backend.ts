import 'server-only';
import { auth } from '@clerk/nextjs/server';

function getApiUrl() {
  if (process.env.API_URL) return process.env.API_URL;
  if (process.env.NODE_ENV === 'production') return null;
  return 'http://localhost:3001/api/v1';
}

/** Server-only call to clinic-backend with the signed-in user's Clerk token. */
export async function backendFetch(path: string, init: RequestInit = {}) {
  const apiUrl = getApiUrl();
  if (!apiUrl) {
    console.error('[bff] Falta la variable de entorno API_URL');
    return Response.json({ message: 'El servidor no está configurado' }, { status: 500 });
  }

  const { getToken } = await auth();
  const token = await getToken();
  if (!token) {
    return Response.json({ message: 'No autorizado' }, { status: 401 });
  }

  try {
    return await fetch(`${apiUrl}/${path.replace(/^\/+/, '')}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });
  } catch (e) {
    console.error('[bff] backend no responde', (e as Error).name);
    return Response.json({ message: 'No se pudo conectar con el servidor' }, { status: 502 });
  }
}
