'use client';

import { useQuery } from '@tanstack/react-query';
import { meQueryOptions } from '@/features/account/api/queries';
import type { NavItem, NavGroup } from '@/types';

function useNavFilter() {
  const me = useQuery(meQueryOptions());
  const canManageTeam = me.data?.canManageTeam === true;

  // Oculto mientras carga o si falla: solo se muestra con permiso confirmado.
  const isVisible = (item: NavItem) =>
    item.access?.permission === 'manage_team' ? canManageTeam : true;

  return function filter(items: NavItem[]): NavItem[] {
    return items.filter(isVisible).map((item) => ({
      ...item,
      items: item.items ? item.items.filter(isVisible) : item.items
    }));
  };
}

export function useFilteredNavItems(items: NavItem[]) {
  return useNavFilter()(items);
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  const filter = useNavFilter();
  return groups.map((group) => ({ ...group, items: filter(group.items) }));
}
