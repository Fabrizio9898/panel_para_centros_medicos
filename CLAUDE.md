# CLAUDE.md — panelParaClinicas

Panel web para el **administrador de una clínica**. No es para médicos ni pacientes.
Next.js 16 (App Router) + React 19 + TypeScript strict, Clerk, Tailwind v4,
shadcn/Base UI, TanStack Query/Table, nuqs, TanStack Form + Zod. Package manager: **bun**.

Estado actual (2026-11-10): turnos (día/semana, filtro, asistió/no vino/cancelar), pacientes
(búsqueda + historial) y ausencias funcionando contra `clinic-backend`. El resto del producto:

- Ver agenda y turnos (hoy/próximos), cancelar y reprogramar.
- Buscar pacientes por teléfono o DNI y ver sus turnos.
- Configurar médicos, especialidades, servicios, disponibilidad y ausencias.
- Configurar campos requeridos del paciente y datos de la clínica.

No incluye (salvo pedido explícito): historia clínica, recetas, facturación, pagos,
gestión de médicos como usuarios, multi-sucursal.

## Comandos

```bash
bun install
bun run dev            # http://localhost:3000
bun run typecheck
bun run lint           # oxlint
bun run build          # cambios no triviales
bun run format         # oxfmt
```

Antes de terminar: `bun run typecheck && bun run lint`.

## Arquitectura de datos

- El navegador llama a `/api/*` (BFF de Next), nunca directo a `clinic-backend`.
- El BFF toma el token de Clerk con `auth()` en el servidor y llama al backend con
  `Authorization: Bearer <token>`. La URL del backend es server-only (`API_URL`), nunca
  `NEXT_PUBLIC_*`. La API key de clínica no se usa en el panel.
- Por feature: `api/types.ts` → `api/service.ts` → `api/queries.ts`. Los componentes importan
  tipos de `types.ts`, funciones de `service.ts` y opciones de `queries.ts`.
- Server: `void prefetchQuery()` + `HydrationBoundary` + `dehydrate`; cliente:
  `useSuspenseQuery` dentro de `<Suspense>`. Mutaciones con `useMutation` e invalidación por
  key factory (`entityKeys.all/list/detail`).
- Estado de URL (filtros, sort, página) con nuqs: `searchParamsCache` en server,
  `useQueryState` con `shallow: true` en cliente.
- El contrato `/admin/*` ya existe en `clinic-backend`; mantené los tipos de
  `features/*/api/types.ts` sincronizados con `src/modules/admin/admin.controller.ts`.

## Criterios de diseño

- **Idioma**: español es-AR. "Turno" (no "cita"), "médico" (no "doctor"), "paciente".
  Fechas y horas en formato local de la clínica (`America/Argentina/Buenos_Aires` por defecto).
- **Público**: administrador de clínica, no técnico. Priorizá claridad y pocos pasos.
  Nada de jerga de desarrollo ni textos del starter en inglés.
- **Densidad**: panel de gestión, table-first. Tablas para listas; cards solo para KPIs o
  resúmenes cortos. No uses heroes, ilustraciones grandes ni animaciones decorativas.
- **Color**: solo tokens semánticos (`bg-background`, `text-muted-foreground`, `bg-primary`,
  `border-border`, `destructive`). Nunca hex/rgb hardcodeados. Funciona en claro y oscuro.
- **Tema**: el selector de temas del starter es de demo. Elegí un tema para el producto y
  ocultá el switcher hasta que haya branding definido (el tema `whatsapp` ya existe).
- **Tipografía**: la del tema; títulos de página con `PageContainer` (`pageTitle`,
  `pageDescription`). No importes `<Heading>` a mano.
- **Espaciado**: escala de 4px, `rounded-lg`, bordes sutiles, sombras mínimas.
- **Iconos**: solo desde `@/components/icons`, un icono por acción, tamaño estándar (16px).
  Nunca importes `@tabler/icons-react` directo.
- **Estados de turno**: `confirmado`, `cancelado`, `reprogramado` con `Badge` y color
  semántico (no inventes colores nuevos). Mostrá fecha + hora juntas: "Hoy 14:30",
  "Mar 12/11 09:00".
- **Formularios**: label arriba, error inline, un solo botón primario, `Button isLoading`
  mientras envía. No borres el foco visible.
- **Feedback**: skeleton que respete el layout (no spinner de página completa), empty state
  con acción concreta, `toast` de Sonner para éxito/error, confirmación para acciones
  destructivas (cancelar turno, borrar médico/servicio).
- **Responsive**: sidebar colapsable; tablas con scroll horizontal; acciones principales
  alcanzables en móvil; no ocultes datos críticos (fecha, paciente, médico, estado).
- **Accesibilidad**: labels asociados, navegación por teclado, `aria-*` en diálogos,
  contraste suficiente. El layout ya incluye skip-link; no lo rompas.

## Componentes

| Necesidad | Usar |
|---|---|
| Página del dashboard | `PageContainer` con `pageTitle`, `pageDescription`, `pageHeaderAction` |
| Lista/tabla | `DataTable` + `useDataTable` + `columns.tsx` por feature |
| Filtros/búsqueda | toolbar del data-table + nuqs (`searchParamsCache`) |
| Crear/editar rápido | `Sheet` o `Dialog` |
| Confirmar destructivo | `AlertModal` / `AlertDialog` |
| Formulario | `useAppForm` + `form.AppField` + `field.TextField/SelectField/DatePickerField...` |
| Botón con carga | `Button isLoading={isPending}` (o `SubmitButton`) |
| Vacío / carga | `Empty`, `Skeleton` |
| Estado | `Badge` |
| Aviso contextual | `Infobar` / `InfoSidebar` |
| Notificación | `toast` de Sonner |
| Clases | `cn()` de `@/lib/utils` |

No edites `src/components/ui/*`; componé o extendé. No agregues una librería de UI, estado,
fechas o fetching si ya existe una en el proyecto.

## Experiencia de usuario

- **Onboarding** (pendiente): si el usuario Clerk no tiene `role`/`clinicId` (backend devuelve
  403), mostrá "Cuenta pendiente de activación" y no un dashboard vacío.
- **Overview**: turnos de hoy, próximos turnos, accesos rápidos ("Nuevo turno", "Ver agenda",
  "Pacientes"). Sin gráficos decorativos si no hay datos reales.
- **Agenda/turnos**: fecha de hoy por defecto; filtros por médico, estado y fecha; cancelar
  desde la fila; confirmación antes de cancelar; refrescar la lista al volver. Reprogramar
  queda pendiente.
- **Pacientes**: búsqueda por teléfono o DNI; resultado con datos mínimos; detalle con turnos
  próximos y pasados. No muestres datos que el backend no expone.
- **Configuración** (pendiente): médicos, especialidades, servicios, horarios y ausencias en
  secciones separadas (tabs o subpáginas). Edición en sheet; borrado con confirmación.
- **Errores**: mensaje claro en español, opción de reintentar, sin stack traces. Si falta
  configuración de la clínica, explicá qué falta y linkeá a la sección.
- **Loading**: skeletons alineados al contenido; no bloquees toda la pantalla por una tabla.
- **Copy**: frases cortas, verbos de acción ("Guardar cambios", "Cancelar turno"), sin
  signos de admiración ni marketing.

## Reglas del starter (no negociables)

1. Iconos solo desde `@/components/icons`; registrá el nuevo en `icons.tsx`.
2. Datos solo por la capa `types.ts` → `service.ts` → `queries.ts`.
3. `PageContainer` para headers; no `<Heading>` manual.
4. Server Components por defecto; `'use client'` solo si hace falta.
5. `cn()` para clases; nada de concatenar strings.
6. Formularios con `useAppForm` y fields compartidos; nada de `useState` dentro del render prop.
7. TypeScript strict; evitá `any`.
8. Componentes con `function Nombre() {}`; props `NombreProps`.

## Dónde leer

- `AGENTS.md` — convenciones completas del starter (data tables, forms, auth, deploy).
- `docs/forms.md`, `docs/themes.md`, `docs/clerk_setup.md`, `docs/deployment.md`.
- `../clinic-backend/CLAUDE.md` — contrato y reglas del backend.
