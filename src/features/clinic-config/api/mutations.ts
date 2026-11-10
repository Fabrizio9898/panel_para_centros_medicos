import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isApiError } from '@/lib/api-client';
import { meKeys } from '@/features/account/api/queries';
import { doctorsKeys, slotKeys } from '@/features/appointments/api/queries';
import { configKeys } from './queries';
import {
  createDoctor,
  createService,
  createSpecialty,
  deleteSpecialty,
  renameSpecialty,
  replaceSchedule,
  updateClinicInfo,
  updateDoctor,
  updateService
} from './service';
import type { ClinicInfoPayload, DoctorPayload, ScheduleRule, ServicePayload } from './types';

/** Estos endpoints responden en español (DTOs y servicio), salvo errores inesperados. */
function message(error: unknown, fallback: string) {
  if (isApiError(error) && [400, 404, 409].includes(error.status)) return error.message;
  return fallback;
}

/**
 * Lo que cambia acá también cambia la lista de médicos de Turnos/Nuevo turno y los
 * horarios libres, así que se invalida todo junto.
 */
function useInvalidateCatalog() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: configKeys.all });
    void queryClient.invalidateQueries({ queryKey: doctorsKeys.all });
    void queryClient.invalidateQueries({ queryKey: slotKeys.all });
  };
}

export function useSaveSpecialty() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, name }: { id?: string; name: string }) =>
      id ? renameSpecialty(id, name) : createSpecialty(name),
    onSuccess: (_s, { id }) => {
      invalidate();
      toast.success(id ? 'Especialidad actualizada' : 'Especialidad creada');
    },
    onError: (error) => toast.error(message(error, 'No se pudo guardar la especialidad'))
  });
}

export function useDeleteSpecialty() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: (id: string) => deleteSpecialty(id),
    onSuccess: () => {
      invalidate();
      toast.success('Especialidad eliminada');
    },
    onError: (error) => toast.error(message(error, 'No se pudo eliminar la especialidad'))
  });
}

export function useSaveDoctor() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id?: string;
      payload: DoctorPayload & { name: string; specialtyIds: string[]; requiresDni: boolean };
    }) => (id ? updateDoctor(id, payload) : createDoctor(payload)),
    onSuccess: (_d, { id }) => {
      invalidate();
      toast.success(id ? 'Médico actualizado' : 'Médico creado');
    },
    onError: (error) => toast.error(message(error, 'No se pudo guardar el médico'))
  });
}

export function useSetDoctorActive() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => updateDoctor(id, { active }),
    onSuccess: (doctor) => {
      invalidate();
      toast.success(doctor.active ? 'Médico activado' : 'Médico desactivado');
    },
    onError: (error) => toast.error(message(error, 'No se pudo actualizar el médico'))
  });
}

export function useSaveService() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({
      id,
      doctorId,
      payload
    }: {
      id?: string;
      doctorId: string;
      payload: ServicePayload;
    }) =>
      id
        ? updateService(id, payload)
        : createService(doctorId, payload as { name: string; durationMin: number }),
    onSuccess: (service, { id, payload }) => {
      invalidate();
      if (!id) toast.success('Servicio agregado');
      else if (payload.active !== undefined)
        toast.success(service.active ? 'Servicio activado' : 'Servicio desactivado');
      else toast.success('Servicio actualizado');
    },
    onError: (error) => toast.error(message(error, 'No se pudo guardar el servicio'))
  });
}

export function useReplaceSchedule() {
  const invalidate = useInvalidateCatalog();
  return useMutation({
    mutationFn: ({ doctorId, rules }: { doctorId: string; rules: ScheduleRule[] }) =>
      replaceSchedule(doctorId, rules),
    onSuccess: ({ appointmentsOutsideHours: n }) => {
      invalidate();
      if (n > 0) {
        toast.warning(
          `Horario guardado. ${n === 1 ? 'Hay 1 turno reservado' : `Hay ${n} turnos reservados`} fuera del horario nuevo.`
        );
      } else {
        toast.success('Horario guardado');
      }
    },
    onError: (error) => toast.error(message(error, 'No se pudo guardar el horario'))
  });
}

export function useUpdateClinicInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClinicInfoPayload) => updateClinicInfo(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: configKeys.clinic() });
      // /users/me trae el nombre de la clínica.
      void queryClient.invalidateQueries({ queryKey: meKeys.all });
      toast.success('Datos del centro guardados');
    },
    onError: (error) => toast.error(message(error, 'No se pudieron guardar los datos'))
  });
}
