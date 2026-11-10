import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getAppointments,
  getDoctors,
  getDoctorSlots,
  getPatientHistory,
  getTimeOffs,
  searchPatients
} from './service';
import type { AppointmentFilters } from './types';

export const appointmentKeys = {
  all: ['appointments'] as const,
  list: (filters: AppointmentFilters) => [...appointmentKeys.all, 'list', filters] as const
};

export const doctorsKeys = {
  all: ['doctors'] as const
};

export const patientKeys = {
  all: ['patients'] as const,
  search: (q: string) => [...patientKeys.all, 'search', q] as const,
  history: (id: string) => [...patientKeys.all, 'history', id] as const
};

export const timeOffKeys = {
  all: ['time-offs'] as const,
  list: (from: string, to: string) => [...timeOffKeys.all, 'list', from, to] as const
};

export const appointmentsQueryOptions = (filters: AppointmentFilters) =>
  queryOptions({
    queryKey: appointmentKeys.list(filters),
    queryFn: () => getAppointments(filters)
  });

export const doctorsQueryOptions = () =>
  queryOptions({
    queryKey: doctorsKeys.all,
    queryFn: getDoctors,
    staleTime: 5 * 60 * 1000
  });

export const slotKeys = {
  all: ['slots'] as const,
  day: (doctorId: string, serviceId: string, date: string) =>
    [...slotKeys.all, doctorId, serviceId, date] as const
};

export const slotsQueryOptions = (doctorId: string, serviceId: string, date: string) =>
  queryOptions({
    queryKey: slotKeys.day(doctorId, serviceId, date),
    queryFn: () => getDoctorSlots(doctorId, serviceId, date),
    enabled: !!doctorId && !!serviceId && !!date,
    staleTime: 0
  });

/** Pantalla Pacientes: lista desde el primer momento y se filtra al escribir. */
export const patientListQueryOptions = (q: string, limit: number) =>
  queryOptions({
    queryKey: [...patientKeys.all, 'list', q, limit] as const,
    queryFn: () => searchPatients(q, limit),
    placeholderData: keepPreviousData
  });

export const patientSearchQueryOptions = (q: string) =>
  queryOptions({
    queryKey: patientKeys.search(q),
    queryFn: () => searchPatients(q),
    enabled: q.trim().length >= 2
  });

export const patientHistoryQueryOptions = (id: string) =>
  queryOptions({
    queryKey: patientKeys.history(id),
    queryFn: () => getPatientHistory(id),
    enabled: !!id
  });

export const timeOffsQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: timeOffKeys.list(from, to),
    queryFn: () => getTimeOffs(from, to)
  });
