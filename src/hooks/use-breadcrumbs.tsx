'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const SEGMENT_TITLES: Record<string, string> = {
  dashboard: 'Panel',
  overview: 'Inicio',
  turnos: 'Turnos',
  pacientes: 'Pacientes',
  ausencias: 'Ausencias',
  'obras-sociales': 'Obras sociales',
  equipo: 'Equipo',
  configuracion: 'Configuración',
  profile: 'Perfil'
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: SEGMENT_TITLES[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
