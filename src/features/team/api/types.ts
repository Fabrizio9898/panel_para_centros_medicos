import type { UserRole } from '@/features/account/api/types';

export type InviteRole = 'clinic_admin' | 'receptionist';

export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: UserRole | null;
  isSelf: boolean;
  removable: boolean;
  createdAt: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: InviteRole;
  invitedAt: string;
  expiresAt: string;
  expired: boolean;
  invitedByEmail: string | null;
  /** Link de registro para mandar por WhatsApp. Null si venció o no hay. */
  inviteUrl: string | null;
}

export interface TeamOverview {
  members: TeamMember[];
  invitations: TeamInvitation[];
}

export interface InvitePayload {
  email: string;
  role: InviteRole;
}
