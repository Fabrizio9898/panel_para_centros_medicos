import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isApiError } from '@/lib/api-client';
import { appointmentKeys, closureKeys, patientKeys, slotKeys, timeOffKeys } from './queries';
import {
  createAppointment,
  createClosure,
  createPatient,
  deleteClosure,
  rescheduleAppointment,
  createTimeOff,
  deleteTimeOff,
  updateAppointmentStatus,
  updatePatient
} from './service';
import type {
  AppointmentStatusUpdate,
  CreateAppointmentPayload,
  CreateClosurePayload,
  CreateTimeOffPayload,
  PatientPayload
} from './types';

/** 400 trae mensajes de class-validator en inglés; 409 trae el mensaje del backend. */
function mutationErrorMessage(error: unknown, fallback: string) {
  if (isApiError(error)) {
    if (error.status === 400) return 'Revisá los datos ingresados';
    if (error.status === 409) return error.message;
  }
  return fallback;
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatusUpdate }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success('Turno actualizado');
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 409) {
        toast.error(error.message);
        void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        return;
      }
      toast.error(mutationErrorMessage(error, 'No se pudo actualizar el turno'));
    }
  });
}

/** El backend ya responde en español en estos endpoints (400 de DTO, 409, 422). */
function backendMessage(error: unknown, fallback: string) {
  if (isApiError(error) && [400, 409, 422].includes(error.status)) return error.message;
  return fallback;
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => createAppointment(payload),
    onSuccess: (appointment) => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
      toast.success(
        `Turno reservado: ${appointment.patient.name}, ${appointment.localDate} ${appointment.localTime}`
      );
    },
    onError: (error) => {
      // Si el horario se ocupó mientras tanto, refrescamos los horarios libres.
      if (isApiError(error) && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: slotKeys.all });
      }
      toast.error(backendMessage(error, 'No se pudo reservar el turno'));
    }
  });
}

export function useSavePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: PatientPayload }) =>
      id ? updatePatient(id, payload) : createPatient(payload),
    onSuccess: (patient, { id }) => {
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      toast.success(id ? 'Paciente actualizado' : `Paciente ${patient.name} cargado`);
    },
    onError: (error) => toast.error(backendMessage(error, 'No se pudo guardar el paciente'))
  });
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTimeOffPayload) => createTimeOff(payload),
    onSuccess: ({ affectedAppointments }) => {
      void queryClient.invalidateQueries({ queryKey: timeOffKeys.all });
      if (affectedAppointments > 0) {
        const turnos =
          affectedAppointments === 1
            ? 'Hay 1 turno reservado'
            : `Hay ${affectedAppointments} turnos reservados`;
        toast.warning(`Ausencia creada. ${turnos} en ese horario.`);
      } else {
        toast.success('Ausencia cargada');
      }
    },
    onError: (error) => toast.error(mutationErrorMessage(error, 'No se pudo guardar la ausencia'))
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
    onError: (error) => toast.error(mutationErrorMessage(error, 'No se pudo eliminar la ausencia'))
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, startsAt }: { id: string; startsAt: string }) =>
      rescheduleAppointment(id, startsAt),
    onSuccess: (appointment) => {
      void queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
      void queryClient.invalidateQueries({ queryKey: slotKeys.all });
      toast.success(`Turno reprogramado: ${appointment.localDate} ${appointment.localTime}`);
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: slotKeys.all });
      }
      toast.error(backendMessage(error, 'No se pudo reprogramar el turno'));
    }
  });
}

export function useCreateClosure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClosurePayload) => createClosure(payload),
    onSuccess: ({ affectedAppointments: n }) => {
      void queryClient.invalidateQueries({ queryKey: closureKeys.all });
      void queryClient.invalidateQueries({ queryKey: slotKeys.all });
      if (n > 0) {
        toast.warning(
          `Cierre cargado. ${n === 1 ? 'Hay 1 turno reservado' : `Hay ${n} turnos reservados`} esos días.`
        );
      } else {
        toast.success('Cierre cargado');
      }
    },
    onError: (error) => toast.error(backendMessage(error, 'No se pudo cargar el cierre'))
  });
}

export function useDeleteClosure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClosure(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: closureKeys.all });
      void queryClient.invalidateQueries({ queryKey: slotKeys.all });
      toast.success('Cierre eliminado');
    },
    onError: (error) => toast.error(backendMessage(error, 'No se pudo eliminar el cierre'))
  });
}
