import type { UserRole } from './api/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  clinic_admin: 'Admin',
  receptionist: 'Recepción',
  doctor: 'Médico'
};

export function roleLabel(role: string | null) {
  if (!role) return 'Sin rol';
  return ROLE_LABELS[role as UserRole] ?? role;
}
