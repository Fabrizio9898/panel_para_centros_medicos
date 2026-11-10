import { NavGroup } from '@/types';
/**
 * Navigation configuration
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Clínica',
    items: [
      {
        title: 'Inicio',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['i', 'i'],
        items: []
      },
      {
        title: 'Turnos',
        url: '/dashboard/turnos',
        icon: 'calendar',
        shortcut: ['t', 't'],
        isActive: false,
        items: []
      },
      {
        title: 'Pacientes',
        url: '/dashboard/pacientes',
        icon: 'teams',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      },
      {
        title: 'Ausencias',
        url: '/dashboard/ausencias',
        icon: 'clock',
        shortcut: ['a', 'a'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: 'Cuenta',
        url: '#',
        icon: 'account',
        isActive: true,
        items: [
          {
            title: 'Perfil',
            url: '/dashboard/profile',
            icon: 'profile',
            shortcut: ['m', 'm']
          }
        ]
      }
    ]
  }
];
