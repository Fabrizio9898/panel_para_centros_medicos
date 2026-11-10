import type { AppointmentStatus } from './api/types';

export const CLINIC_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  attended: 'Asistió',
  no_show: 'No vino'
};

export const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as AppointmentStatus[]).map((value) => ({
  value,
  label: STATUS_LABELS[value]
}));

export const CLOSED_STATUSES: AppointmentStatus[] = ['cancelled', 'attended', 'no_show'];
