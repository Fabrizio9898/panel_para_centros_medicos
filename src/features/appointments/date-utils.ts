import { endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import { CLINIC_TIMEZONE } from './constants';

/** YYYY-MM-DD in the clinic timezone (not the browser's). */
export function todayLocal() {
  return new Date().toLocaleDateString('en-CA', { timeZone: CLINIC_TIMEZONE });
}

export function addDaysLocal(date: string, days: number) {
  const next = parseISO(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return format(next, 'yyyy-MM-dd');
}

export function rangeFor(date: string, view: 'day' | 'week') {
  if (view !== 'week') return { from: date, to: date };
  const parsed = parseISO(`${date}T00:00:00`);
  return {
    from: format(startOfWeek(parsed, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    to: format(endOfWeek(parsed, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  };
}

/**
 * Convierte el valor de un `datetime-local` (hora de pared de la clínica) a ISO UTC.
 * Argentina no tiene horario de verano, por eso el offset fijo -03:00 alcanza para
 * CLINIC_TIMEZONE; si cambia la zona hay que revisar esto.
 */
export function clinicLocalToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?$/.test(value)) return null;
  const date = new Date(`${value.length === 16 ? `${value}:00` : value}-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
