import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isApiError } from '@/lib/api-client';
import { teamKeys } from './queries';
import { inviteMember, removeMember, revokeInvitation } from './service';
import type { InvitePayload } from './types';

/** 400/409/502 traen el mensaje del backend, ya en español. */
function errorMessage(error: unknown, fallback: string) {
  if (isApiError(error) && [400, 409, 502].includes(error.status)) return error.message;
  return fallback;
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvitePayload) => inviteMember(payload),
    onSuccess: (_data, { email }) => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
      toast.success(`Invitación enviada a ${email}`);
    },
    onError: (error) => toast.error(errorMessage(error, 'No se pudo enviar la invitación'))
  });
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeInvitation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
      toast.success('Invitación revocada');
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'No se pudo revocar la invitación'));
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
    }
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeMember(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
      toast.success('Acceso quitado');
    },
    onError: (error) => {
      toast.error(errorMessage(error, 'No se pudo quitar el acceso'));
      void queryClient.invalidateQueries({ queryKey: teamKeys.all });
    }
  });
}
