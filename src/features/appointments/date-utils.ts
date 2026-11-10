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
