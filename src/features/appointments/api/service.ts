import { apiClient } from '@/lib/api-client';
import type {
  Appointment,
  AppointmentFilters,
  AppointmentStatusUpdate,
  CreateAppointmentPayload,
  CreateTimeOffPayload,
  CreateTimeOffResponse,
  DaySlots,
  DoctorOption,
  Patient,
  PatientHistory,
  PatientPayload,
  TimeOff
} from './types';

function query(params: Record<string, string | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return search.toString();
}

export async function getAppointments(filters: AppointmentFilters) {
  return apiClient<Appointment[]>(`/clinic/admin/appointments?${query({ ...filters })}`);
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatusUpdate) {
  return apiClient<Appointment>(`/clinic/admin/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  return apiClient<Appointment>('/clinic/admin/appointments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getDoctors() {
  return apiClient<DoctorOption[]>('/clinic/admin/doctors');
}

export async function getDoctorSlots(doctorId: string, serviceId: string, date: string) {
  return apiClient<DaySlots>(
    `/clinic/admin/doctors/${doctorId}/slots?${query({ serviceId, date })}`
  );
}

export async function createPatient(payload: PatientPayload) {
  return apiClient<Patient>('/clinic/admin/patients', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updatePatient(id: string, payload: PatientPayload) {
  return apiClient<Patient>(`/clinic/admin/patients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

/** `q` vacío trae todos (ordenados por nombre), hasta `limit`. */
export async function searchPatients(q: string, limit?: number) {
  return apiClient<Patient[]>(
    `/clinic/admin/patients?${query({ q, limit: limit ? String(limit) : undefined })}`
  );
}

export async function getPatientHistory(id: string) {
  return apiClient<PatientHistory>(`/clinic/admin/patients/${id}/appointments`);
}

export async function getTimeOffs(from: string, to: string) {
  return apiClient<TimeOff[]>(`/clinic/admin/time-offs?${query({ from, to })}`);
}

export async function createTimeOff(payload: CreateTimeOffPayload) {
  return apiClient<CreateTimeOffResponse>('/clinic/admin/time-offs', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function deleteTimeOff(id: string) {
  return apiClient<void>(`/clinic/admin/time-offs/${id}`, { method: 'DELETE' });
}
