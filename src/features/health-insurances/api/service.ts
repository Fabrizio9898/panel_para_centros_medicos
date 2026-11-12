import { apiClient } from '@/lib/api-client';
import type { CoverageReport, HealthInsurance } from './types';

const BASE = '/clinic/admin/health-insurances';

export const getHealthInsurances = () => apiClient<HealthInsurance[]>(BASE);

export const createHealthInsurance = (name: string) =>
  apiClient<HealthInsurance>(BASE, { method: 'POST', body: JSON.stringify({ name }) });

export const updateHealthInsurance = (id: string, payload: { name?: string; active?: boolean }) =>
  apiClient<HealthInsurance>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });

export const getCoverageReport = (from: string, to: string) =>
  apiClient<CoverageReport>(`${BASE}/report?${new URLSearchParams({ from, to })}`);
