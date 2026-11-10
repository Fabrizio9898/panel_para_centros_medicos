'use client';

import { useEffect, useState } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { useReplaceSchedule } from '../api/mutations';
import type { ScheduleRule } from '../api/types';

/** Lunes primero, como se piensa la semana en un consultorio. 0 = domingo. */
export const WEEK: { day: number; label: string; short: string }[] = [
  { day: 1, label: 'Lunes', short: 'Lun' },
  { day: 2, label: 'Martes', short: 'Mar' },
  { day: 3, label: 'Miércoles', short: 'Mié' },
  { day: 4, label: 'Jueves', short: 'Jue' },
  { day: 5, label: 'Viernes', short: 'Vie' },
  { day: 6, label: 'Sábado', short: 'Sáb' },
  { day: 0, label: 'Domingo', short: 'Dom' }
];

type Range = { startTime: string; endTime: string };
type Week = Record<number, Range[]>;

function toWeek(rules: ScheduleRule[]): Week {
  const week: Week = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const r of rules) week[r.dayOfWeek].push({ startTime: r.startTime, endTime: r.endTime });
  for (const day of Object.keys(week)) {
    week[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return week;
}

function toRules(week: Week): ScheduleRule[] {
  return WEEK.flatMap(({ day }) =>
    week[day].map((r) => ({ dayOfWeek: day, startTime: r.startTime, endTime: r.endTime }))
  );
}

/** Mismo criterio que el backend, para marcar el error antes de guardar. */
function dayError(ranges: Range[]): string | null {
  if (ranges.some((r) => !r.startTime || !r.endTime)) return 'Completá las horas';
  if (ranges.some((r) => r.startTime >= r.endTime)) return 'El inicio tiene que ser antes del fin';
  const sorted = ranges.toSorted((a, b) => a.startTime.localeCompare(b.startTime));
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime < sorted[i - 1].endTime) return 'Las franjas se superponen';
  }
  return null;
}

/** "Lun a Vie 08:00–19:00" o "Lun 08:00–12:00 · Mié 14:00–18:00". */
export function scheduleSummary(rules: ScheduleRule[]): string {
  if (rules.length === 0) return 'Sin horario';
  const week = toWeek(rules);
  const key = (day: number) => week[day].map((r) => `${r.startTime}–${r.endTime}`).join(', ');
  const parts: string[] = [];
  let i = 0;
  while (i < WEEK.length) {
    const k = key(WEEK[i].day);
    if (!k) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < WEEK.length && key(WEEK[j + 1].day) === k) j++;
    const days = j > i ? `${WEEK[i].short} a ${WEEK[j].short}` : WEEK[i].short;
    parts.push(`${days} ${k}`);
    i = j + 1;
  }
  return parts.join(' · ');
}

export function ScheduleEditor({ doctorId, rules }: { doctorId: string; rules: ScheduleRule[] }) {
  const [week, setWeek] = useState<Week>(() => toWeek(rules));
  const save = useReplaceSchedule();

  // Solo se resetea si cambió lo guardado (no en cada refetch con los mismos datos),
  // así no se pierde lo que se está editando.
  const savedKey = JSON.stringify(rules);
  useEffect(() => setWeek(toWeek(JSON.parse(savedKey) as ScheduleRule[])), [savedKey]);

  const errors = Object.fromEntries(WEEK.map(({ day }) => [day, dayError(week[day])]));
  const hasErrors = Object.values(errors).some(Boolean);
  const dirty = JSON.stringify(toRules(week)) !== JSON.stringify(toRules(toWeek(rules)));

  const update = (day: number, ranges: Range[]) => setWeek((w) => ({ ...w, [day]: ranges }));

  return (
    <div className='space-y-3'>
      <div className='divide-y rounded-lg border'>
        {WEEK.map(({ day, label }) => (
          <div key={day} className='flex flex-col gap-2 p-3 sm:flex-row sm:items-start'>
            <div className='w-24 shrink-0 pt-1.5 text-sm font-medium'>{label}</div>
            <div className='flex flex-1 flex-col gap-2'>
              {week[day].length === 0 && (
                <span className='text-muted-foreground pt-1.5 text-sm'>No atiende</span>
              )}
              {week[day].map((range, index) => (
                <div key={index} className='flex items-center gap-2'>
                  <Input
                    type='time'
                    step={900}
                    aria-label={`${label}: desde`}
                    className='w-[120px]'
                    value={range.startTime}
                    onChange={(e) =>
                      update(
                        day,
                        week[day].map((r, i) =>
                          i === index ? { ...r, startTime: e.target.value } : r
                        )
                      )
                    }
                  />
                  <span className='text-muted-foreground text-sm'>a</span>
                  <Input
                    type='time'
                    step={900}
                    aria-label={`${label}: hasta`}
                    className='w-[120px]'
                    value={range.endTime}
                    onChange={(e) =>
                      update(
                        day,
                        week[day].map((r, i) =>
                          i === index ? { ...r, endTime: e.target.value } : r
                        )
                      )
                    }
                  />
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={`Quitar franja del ${label.toLowerCase()}`}
                    onClick={() =>
                      update(
                        day,
                        week[day].filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Icons.close />
                  </Button>
                </div>
              ))}
              {errors[day] && (
                <p role='alert' className='text-destructive text-sm'>
                  {errors[day]}
                </p>
              )}
            </div>
            <div className='flex gap-1'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  const last = week[day].at(-1);
                  update(day, [
                    ...week[day],
                    last
                      ? { startTime: last.endTime, endTime: '' }
                      : { startTime: '08:00', endTime: '12:00' }
                  ]);
                }}
              >
                <Icons.add className='mr-1 h-4 w-4' /> Franja
              </Button>
              {day === 1 && week[1].length > 0 && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    setWeek((w) => ({
                      ...w,
                      2: w[1].map((r) => ({ ...r })),
                      3: w[1].map((r) => ({ ...r })),
                      4: w[1].map((r) => ({ ...r })),
                      5: w[1].map((r) => ({ ...r }))
                    }))
                  }
                >
                  Copiar a Mar–Vie
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className='flex justify-end gap-2'>
        {dirty && (
          <Button variant='outline' onClick={() => setWeek(toWeek(rules))}>
            Descartar
          </Button>
        )}
        <LoadingButton
          loading={save.isPending}
          disabled={!dirty || hasErrors}
          onClick={() => save.mutate({ doctorId, rules: toRules(week) })}
        >
          Guardar horario
        </LoadingButton>
      </div>
    </div>
  );
}
