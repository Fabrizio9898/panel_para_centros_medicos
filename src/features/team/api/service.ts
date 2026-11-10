import { apiClient } from '@/lib/api-client';
import type { InvitePayload, TeamInvitation, TeamOverview } from './types';

export async function getTeam() {
  return apiClient<TeamOverview>('/clinic/admin/team');
}

export async function inviteMember(payload: InvitePayload) {
  return apiClient<TeamInvitation>('/clinic/admin/team/invitations', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function revokeInvitation(id: string) {
  return apiClient<void>(`/clinic/admin/team/invitations/${id}`, { method: 'DELETE' });
}

export async function removeMember(id: string) {
  return apiClient<void>(`/clinic/admin/team/members/${id}`, { method: 'DELETE' });
}
