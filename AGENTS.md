# AGENTS.md

This file gives AI coding agents the mental model and rules to work on this project. Read it before making changes.

---

## What this is

A production-ready **admin dashboard** built with:

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **UI**: Tailwind CSS v4, shadcn/ui components on Base UI primitives
- **Auth**: Clerk
- **Data**: TanStack React Query (server prefetch + client cache), TanStack Table, nuqs for URL state
- **Forms**: TanStack Form + Zod (`useAppForm`)
- **Charts**: Recharts
- **Package manager**: Bun

Feature-based structure: each feature lives in `src/features/<name>/` with its own API layer, components, and schemas.

---

## Commands

```bash
bun install            # install deps
bun run dev            # dev server on http://localhost:3000
bun run build          # production build
bun run typecheck      # tsc --noEmit
bun run lint           # oxlint
bun run format         # oxfmt
```

**Before finishing any task: run `bun run typecheck` and `bun run lint`.** Also run `bun run build` for non-trivial changes.

---

## Mental map

```
src/
├── app/                    # Next.js App Router routes
│   ├── auth/               # sign-in / sign-up
│   ├── dashboard/          # protected pages (overview, product, users, ai-chat, notifications, profile)
│   ├── api/                # route handlers (REST/BFF)
│   ├── layout.tsx, page.tsx, global-error.tsx, not-found.tsx
│   └── proxy.ts            # Clerk middleware — protects /dashboard(.*)
│
├── components/
│   ├── ui/                 # shadcn primitives — DO NOT EDIT, extend instead
│   ├── layout/             # sidebar, header, page-container
│   ├── forms/fields/       # form field components (field.TextField, etc.)
│   ├── themes/             # theme registry, switcher
│   ├── kbar/               # Command+K
│   └── icons.tsx           # ONLY source of icons
│
├── features/<name>/        # feature modules
│   ├── api/
│   │   ├── types.ts        # type contract (responses, filters, payloads)
│   │   ├── service.ts      # data access — THE ONLY FILE to swap for a real backend
│   │   └── queries.ts      # query key factory + queryOptions (never changes)
│   ├── components/         # listing, form, table components
│   ├── schemas/            # Zod schemas
│   └── constants/          # filter options
│
├── config/nav-config.ts    # sidebar + Cmd+K navigation groups
├── hooks/                  # use-nav, use-data-table, ...
├── lib/                    # form.ts (useAppForm), query-client.ts, searchparams.ts, utils.ts, api-client.ts
├── types/index.ts          # NavItem, NavGroup, ...
└── styles/themes/          # theme CSS files
```

---

## Golden rules (non-negotiable)

1. **Icons** — never import from `@tabler/icons-react` (or any icon package) directly. Register icons in `src/components/icons.tsx`, then use `import { Icons } from '@/components/icons'` and `<Icons.name />`.
2. **Data layer** — always go through the service layer: `types.ts` → `service.ts` → `queries.ts`. Components import types from `types.ts`, functions from `service.ts`, query options from `queries.ts`. Never import `@/constants/mock-api*` directly in components.
3. **Page headers** — use `PageContainer` props (`pageTitle`, `pageDescription`, `pageHeaderAction`). Never import `<Heading>` manually in pages.
4. **React Query** — use `void queryClient.prefetchQuery(options)` + `HydrationBoundary` + `dehydrate` on the server, and `useSuspenseQuery` (not `useQuery`) on the client, wrapped in `<Suspense>`. Mutations use query key factories for invalidation.
5. **Class names** — always use `cn()` from `@/lib/utils` to merge classes; never concatenate strings.
6. **shadcn components** — don't modify files in `src/components/ui/` directly; extend or compose them instead.
7. **Server components by default** — add `'use client'` only when using browser APIs or React hooks.
8. **Button loading** — use `<Button isLoading={isPending}>` for loading states. `SubmitButton` handles this automatically in forms.
9. **Forms** — use `useAppForm` from `@/lib/form` with `form.AppField` rendering shared fields (`field.TextField`, `field.SelectField`, ...) from `@/components/forms/fields`. Drop to raw `form.Field` render props only for one-off custom fields. Never call `useState` inside a render prop.
10. **Types** — strict mode on; avoid `any`, prefer explicit types and interfaces.
11. **Client env vars** — prefix with `NEXT_PUBLIC_` for client-side access.
12. **Function style** — use function declarations for components (`function ComponentName() {}`), props interface named `{ComponentName}Props`.

---

## Task recipes

### Add a new page

1. Create `src/app/dashboard/<name>/page.tsx` (server component).
2. Wrap content in `PageContainer` with `pageTitle` / `pageDescription`.
3. Add a nav item in `src/config/nav-config.ts`.
4. Register any new icon in `src/components/icons.tsx`.

### Add a new feature (end-to-end)

1. `src/features/<name>/api/types.ts` — response types, filters, payloads.
2. `src/features/<name>/api/service.ts` — data access functions (mock by default).
3. `src/features/<name>/api/queries.ts` — query key factory + `queryOptions`.
4. Components in `src/features/<name>/components/`.
5. Page route in `src/app/dashboard/<name>/page.tsx` (server prefetch + `HydrationBoundary` + `<Suspense>`).
6. Nav item in `src/config/nav-config.ts`.
7. (Optional) route handlers in `src/app/api/<name>/`; icon in `icons.tsx`.

### Add a data table

- Query options in `features/*/api/queries.ts`, columns in `features/*/components/*-tables/columns.tsx`, table via `src/components/ui/table/data-table.tsx` + `useDataTable` hook. Use nuqs (`searchParamsCache` server / `useQueryState` client with `shallow: true`) for URL-synced search, filter, sort, pagination.

### Add a form

- Zod schema in `features/*/schemas/`, then `useAppForm({ defaultValues, validators: { onSubmit: schema }, onSubmit })` rendering `field.*` components. Submit via `useMutation` and invalidate with the feature's query key factory.

### Add a theme

1. Create `src/styles/themes/<name>.css` with `[data-theme='<name>']` selector.
2. Import it in `src/styles/theme.css`.
3. Register in the `THEMES` array in `src/components/themes/theme.config.ts`.
4. (Optional) fonts in `font.config.ts`. See `docs/themes.md`.

---

## Auth

`src/proxy.ts` uses `clerkMiddleware` to protect `/dashboard(.*)`. In protected pages, check the session:

```tsx
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function Page() {
  const { userId } = await auth();
  if (!userId) redirect('/auth/sign-in');
  // ...
}
```

---

## Where to find detail

- `docs/forms.md` — form system, field components, multi-step, sheet/dialog forms
- `docs/themes.md` — theming guide
- `docs/clerk_setup.md` — Clerk auth setup
- `docs/deployment.md` — Vercel/Docker deployment
- `.agents/skills/kiranism-shadcn-dashboard/` — project skill with the full patterns (loads automatically on relevant tasks)