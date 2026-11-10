import { backendFetch } from '@/lib/backend';
import type { NextRequest } from 'next/server';

const UUID = '[0-9a-fA-F-]{36}';

const ALLOWED: { method: string; pattern: RegExp }[] = [
  { method: 'GET', pattern: /^admin\/appointments$/ },
  { method: 'GET', pattern: /^admin\/patients$/ },
  { method: 'GET', pattern: new RegExp(`^admin\\/patients\\/${UUID}\\/appointments$`) },
  { method: 'GET', pattern: /^admin\/doctors$/ },
  { method: 'GET', pattern: /^admin\/time-offs$/ },
  { method: 'POST', pattern: /^admin\/time-offs$/ },
  { method: 'DELETE', pattern: new RegExp(`^admin\\/time-offs\\/${UUID}$`) },
  { method: 'PATCH', pattern: new RegExp(`^admin\\/appointments\\/${UUID}\\/status$`) },
  { method: 'GET', pattern: /^users\/me$/ }
];

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = path.join('/');
  const allowed = ALLOWED.some((route) => route.method === req.method && route.pattern.test(target));
  if (!allowed) {
    return Response.json({ message: 'No encontrado' }, { status: 404 });
  }

  const search = new URL(req.url).search;
  const body = req.method === 'GET' || req.method === 'DELETE' ? undefined : await req.text();
  const upstream = await backendFetch(`${target}${search}`, {
    method: req.method,
    body: body || undefined
  });

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' }
  });
}

export { handle as DELETE, handle as GET, handle as PATCH, handle as POST };
