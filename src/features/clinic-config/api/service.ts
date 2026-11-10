import { apiClient } from '@/lib/api-client';
import type {
  ClinicInfo,
  ClinicInfoPayload,
  ConfigDoctor,
  ConfigService,
  DoctorPayload,
  ScheduleResult,
  ScheduleRule,
  ServicePayload,
  Specialty
} from './types';

const BASE = '/clinic/admin/config';

function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}

export const getSpecialties = () => apiClient<Specialty[]>(`${BASE}/specialties`);

export const createSpecialty = (name: string) =>
  apiClient<Specialty>(`${BASE}/specialties`, json('POST', { name }));

export const renameSpecialty = (id: string, name: string) =>
  apiClient<Specialty>(`${BASE}/specialties/${id}`, json('PATCH', { name }));

export const deleteSpecialty = (id: string) =>
  apiClient<void>(`${BASE}/specialties/${id}`, { method: 'DELETE' });

export const getConfigDoctors = () => apiClient<ConfigDoctor[]>(`${BASE}/doctors`);

export const createDoctor = (payload: Required<Omit<DoctorPayload, 'active'>>) =>
  apiClient<ConfigDoctor>(`${BASE}/doctors`, json('POST', payload));

export const updateDoctor = (id: string, payload: DoctorPayload) =>
  apiClient<ConfigDoctor>(`${BASE}/doctors/${id}`, json('PATCH', payload));

export const createService = (doctorId: string, payload: { name: string; durationMin: number }) =>
  apiClient<ConfigService>(`${BASE}/doctors/${doctorId}/services`, json('POST', payload));

export const updateService = (id: string, payload: ServicePayload) =>
  apiClient<ConfigService>(`${BASE}/services/${id}`, json('PATCH', payload));

export const replaceSchedule = (doctorId: string, rules: ScheduleRule[]) =>
  apiClient<ScheduleResult>(`${BASE}/doctors/${doctorId}/schedule`, json('PUT', { rules }));

export const getClinicInfo = () => apiClient<ClinicInfo>(`${BASE}/clinic`);

export const updateClinicInfo = (payload: ClinicInfoPayload) =>
  apiClient<ClinicInfo>(`${BASE}/clinic`, json('PATCH', payload));
