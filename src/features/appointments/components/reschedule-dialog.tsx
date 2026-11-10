'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { isApiError } from '@/lib/api-client';
import { useRescheduleAppointment } from '../api/mutations';
import { slotsQueryOptions } from '../api/queries';
import type { Appointment, Slot } from '../api/types';
import { addDaysLocal, todayLocal } from '../date-utils';

/** Mismo médico y servicio; solo cambia día y hora. */
export function RescheduleDialog({
  appointment,
  onClose
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const today = todayLocal();
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<Slot | null>(null);
  const reschedule = useRescheduleAppointment();

  // Se resetea al abrir otro turno, no en cada refetch de la lista.
  const openKey = appointment ? `${appointment.id}|${appointment.localDate}` : '';
  useEffect(() => {
    if (!openKey) return;
    // Arranca en el día del turno (si no pasó) para ver horarios cercanos.
    const [d, m, y] = openKey.split('|')[1].split('/');
    const current = `${y}-${m}-${d}`;
    setDate(current >= today ? current : today);
    setSlot(null);
  }, [openKey, today]);

  const slots = useQuery(
    slotsQueryOptions(appointment?.doctor.id ?? '', appointment?.service.id ?? '', date)
  );

  const move = (days: number) => {
    setDate((d) => addDaysLocal(d, days));
    setSlot(null);
  };

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Reprogramar turno</DialogTitle>
          {appointment && (
            <DialogDescription>
              {appointment.patient.name} · {appointment.doctor.name} · {appointment.service.name}
              <br />
              Ahora: {appointment.localDate} {appointment.localTime}
            </DialogDescription>
          )}
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor='reschedule-date'>Nuevo día</FieldLabel>
            <div className='flex items-center gap-1'>
              <Button
                variant='outline'
                size='icon-sm'
                aria-label='Día anterior'
                disabled={date <= today}
                onClick={() => move(-1)}
              >
                <Icons.chevronLeft />
              </Button>
              <Input
                id='reschedule-date'
                type='date'
                className='w-[160px]'
                min={today}
                value={date}
                onChange={(e) => {
                  if (e.target.value && e.target.value >= today) {
                    setDate(e.target.value);
                    setSlot(null);
                  }
                }}
              />
              <Button
                variant='outline'
                size='icon-sm'
                aria-label='Día siguiente'
                onClick={() => move(1)}
              >
                <Icons.chevronRight />
              </Button>
              <span className='text-muted-foreground ml-2 text-sm capitalize'>
                {format(parseISO(`${date}T00:00:00`), 'EEEE d/MM', { locale: es })}
              </span>
            </div>
          </Field>

          <Field>
            <FieldLabel>Nuevo horario</FieldLabel>
            {slots.isLoading ? (
              <div className='grid grid-cols-4 gap-2 sm:grid-cols-6'>
                {Array.from({ length: 12 }, (_, i) => (
                  <Skeleton key={i} className='h-8' />
                ))}
              </div>
            ) : slots.isError ? (
              <p role='alert' className='text-destructive text-sm'>
                {isApiError(slots.error) && slots.error.status < 500
                  ? slots.error.message
                  : 'No se pudieron cargar los horarios.'}{' '}
                <button type='button' className='underline' onClick={() => void slots.refetch()}>
                  Reintentar
                </button>
              </p>
            ) : (slots.data?.slots.length ?? 0) === 0 ? (
              <p className='text-muted-foreground text-sm'>
                Sin horarios libres ese día.{' '}
                <button type='button' className='text-foreground underline' onClick={() => move(1)}>
                  Ver el día siguiente
                </button>
              </p>
            ) : (
              <div
                role='group'
                aria-label='Horarios libres'
                className='grid grid-cols-4 gap-2 sm:grid-cols-6'
              >
                {slots.data?.slots.map((s) => {
                  const selected = slot?.startUtc === s.startUtc;
                  return (
                    <Button
                      key={s.startUtc}
                      aria-pressed={selected}
                      size='sm'
                      variant={selected ? 'default' : 'outline'}
                      className='tabular-nums'
                      onClick={() => setSlot(s)}
                    >
                      {s.start}
                    </Button>
                  );
                })}
              </div>
            )}
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancelar
          </Button>
          <LoadingButton
            loading={reschedule.isPending}
            disabled={!slot || !appointment}
            onClick={() =>
              appointment &&
              slot &&
              reschedule.mutate(
                { id: appointment.id, startsAt: slot.startUtc },
                {
                  onSuccess: onClose,
                  onError: (error) => {
                    if (isApiError(error) && error.status === 409) setSlot(null);
                  }
                }
              )
            }
          >
            {slot ? `Mover a las ${slot.start}` : 'Reprogramar'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
