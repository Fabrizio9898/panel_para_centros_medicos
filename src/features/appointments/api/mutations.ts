import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { appointmentKeys, timeOffKeys } from './queries';
import { createTimeOff, deleteTimeOff, updateAppointmentStatus } from './service';
import type { AppointmentStatus, CreateTimeOffPayload } from './types';

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Turno actualizado');
    },
    onError: () => toast.error('No se pudo actualizar el turno')
  });
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTimeOffPayload) => createTimeOff(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeOffKeys.all });
      toast.success('Ausencia cargada');
    },
    onError: () => toast.error('No se pudo guardar la ausencia')
  });
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTimeOff(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: timeOffKeys.all });
      toast.success('Ausencia eliminada');
    },
    onError: () => toast.error('No se pudo eliminar la ausencia')
  });
}
