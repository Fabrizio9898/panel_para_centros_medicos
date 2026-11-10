import { backendFetch } from '@/lib/backend';
import type { NextRequest } from 'next/server';

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

const ALLOWED: { method: string; pattern: RegExp }[] = [
  { method: 'GET', pattern: /^users\/me$/ },
  { method: 'GET', pattern: /^admin\/team$/ },
  { method: 'POST', pattern: /^admin\/team\/invitations$/ },
  { method: 'DELETE', pattern: new RegExp(`^admin\\/team\\/invitations\\/${UUID}$`) },
  { method: 'DELETE', pattern: new RegExp(`^admin\\/team\\/members\\/${UUID}$`) },
  { method: 'GET', pattern: /^admin\/config\/clinic$/ },
  { method: 'PATCH', pattern: /^admin\/config\/clinic$/ },
  { method: 'GET', pattern: /^admin\/closures$/ },
  { method: 'POST', pattern: /^admin\/closures$/ },
  { method: 'DELETE', pattern: new RegExp(`^admin\\/closures\\/${UUID}$`) },
  { method: 'POST', pattern: new RegExp(`^admin\\/appointments\\/${UUID}\\/reschedule$`) },
  { method: 'GET', pattern: /^admin\/config\/(specialties|doctors)$/ },
  { method: 'POST', pattern: /^admin\/config\/(specialties|doctors)$/ },
  {
    method: 'PATCH',
    pattern: new RegExp(`^admin\\/config\\/(specialties|doctors|services)\\/${UUID}$`)
  },
  { method: 'DELETE', pattern: new RegExp(`^admin\\/config\\/specialties\\/${UUID}$`) },
  { method: 'POST', pattern: new RegExp(`^admin\\/config\\/doctors\\/${UUID}\\/services$`) },
  { method: 'PUT', pattern: new RegExp(`^admin\\/config\\/doctors\\/${UUID}\\/schedule$`) },
  { method: 'GET', pattern: /^admin\/appointments$/ },
  { method: 'POST', pattern: /^admin\/appointments$/ },
  { method: 'GET', pattern: /^admin\/patients$/ },
  { method: 'POST', pattern: /^admin\/patients$/ },
  { method: 'PATCH', pattern: new RegExp(`^admin\\/patients\\/${UUID}$`) },
  { method: 'GET', pattern: new RegExp(`^admin\\/doctors\\/${UUID}\\/slots$`) },
  { method: 'GET', pattern: new RegExp(`^admin\\/patients\\/${UUID}\\/appointments$`) },
  { method: 'GET', pattern: /^admin\/doctors$/ },
  { method: 'GET', pattern: /^admin\/time-offs$/ },
  { method: 'POST', pattern: /^admin\/time-offs$/ },
  { method: 'DELETE', pattern: new RegExp(`^admin\\/time-offs\\/${UUID}$`) },
  { method: 'PATCH', pattern: new RegExp(`^admin\\/appointments\\/${UUID}\\/status$`) }
];

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = path.join('/');
  const allowed = ALLOWED.some(
    (route) => route.method === req.method && route.pattern.test(target)
  );
  if (!allowed) {
    return Response.json({ message: 'No encontrado' }, { status: 404 });
  }

  const search = new URL(req.url).search;
  const body = req.method === 'GET' || req.method === 'DELETE' ? undefined : await req.text();
  const upstream = await backendFetch(`${target}${search}`, {
    method: req.method,
    body: body || undefined
  });

  if (upstream.status === 204 || upstream.status === 304) {
    return new Response(null, { status: upstream.status });
  }

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' }
  });
}

export { handle as DELETE, handle as GET, handle as PATCH, handle as POST, handle as PUT };
