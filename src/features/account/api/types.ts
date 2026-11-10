export type UserRole = 'admin' | 'clinic_admin' | 'receptionist' | 'doctor';

/** Respuesta de `GET /users/me`. */
export interface Me {
  email: string;
  role: UserRole | null;
  clinicName: string | null;
  canManageTeam: boolean;
}
