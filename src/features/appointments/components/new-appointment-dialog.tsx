'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useDebounce } from '@/hooks/use-debounce';
import { isApiError } from '@/lib/api-client';
import { PatientFormDialog } from '@/features/patients/components/patient-form-dialog';
import { useCreateAppointment } from '../api/mutations';
import { doctorsQueryOptions, patientSearchQueryOptions, slotsQueryOptions } from '../api/queries';
import type { DoctorOption, Patient, Slot } from '../api/types';
import { addDaysLocal, todayLocal } from '../date-utils';

export type NewAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Para abrirlo con un médico o una fecha ya elegidos (por ejemplo, desde el filtro). */
  defaultDoctorId?: string | null;
  defaultDate?: string;
};

function doctorLabel(doctor: DoctorOption) {
  return doctor.specialties.length > 0
    ? `${doctor.name} · ${doctor.specialties.join(', ')}`
    : doctor.name;
}

export function NewAppointmentDialog({
  open,
  onOpenChange,
  defaultDoctorId,
  defaultDate
}: NewAppointmentDialogProps) {
  const today = todayLocal();
  const doctors = useQuery(doctorsQueryOptions());
  const create = useCreateAppointment();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(today);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [patientDialog, setPatientDialog] = useState<{
    patient: Patient | null;
    query: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setPatient(null);
    setDoctorId(defaultDoctorId ?? '');
    setServiceId('');
    setDate(defaultDate && defaultDate >= today ? defaultDate : today);
    setSlot(null);
    setNotes('');
  }, [open, defaultDoctorId, defaultDate, today]);

  const bookable = useMemo(
    () => (doctors.data ?? []).filter((d) => d.services.length > 0),
    [doctors.data]
  );
  const doctor = bookable.find((d) => d.id === doctorId) ?? null;
  const services = useMemo(() => doctor?.services ?? [], [doctor]);

  // Un solo servicio: se elige solo.
  useEffect(() => {
    if (services.length === 1) setServiceId(services[0].id);
  }, [services]);

  const slots = useQuery(slotsQueryOptions(doctorId, serviceId, date));

  const missingDni =
    !!patient && !!doctor && doctor.patientRequiredFields.includes('dni') && !patient.dni;
  const canSubmit = !!patient && !!doctor && !!serviceId && !!slot && !missingDni;

  function submit() {
    if (!patient || !doctor || !slot) return;
    create.mutate(
      {
        doctorId: doctor.id,
        patientId: patient.id,
        serviceId,
        startsAt: slot.startUtc,
        notes: notes.trim() || undefined
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => {
          if (isApiError(error) && error.status === 409) setSlot(null);
        }
      }
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Nuevo turno</DialogTitle>
          </DialogHeader>

          <div className='max-h-[70vh] overflow-y-auto pr-1'>
            <FieldGroup>
              <Field>
                <FieldLabel>Paciente *</FieldLabel>
                {patient ? (
                  <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
                    <div className='text-sm'>
                      <div className='font-medium'>{patient.name}</div>
                      <div className='text-muted-foreground'>
                        {patient.phone}
                        {patient.dni ? ` · DNI ${patient.dni}` : ''}
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => setPatientDialog({ patient, query: '' })}
                      >
                        <Icons.edit className='mr-1 h-4 w-4' /> Editar
                      </Button>
                      <Button variant='outline' size='sm' onClick={() => setPatient(null)}>
                        Cambiar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <PatientPicker
                    onPick={setPatient}
                    onCreate={(query) => setPatientDialog({ patient: null, query })}
                  />
                )}
                {missingDni && (
                  <p role='alert' className='text-destructive text-sm'>
                    {doctor?.name} pide DNI.{' '}
                    <button
                      type='button'
                      className='underline'
                      onClick={() => setPatientDialog({ patient, query: '' })}
                    >
                      Cargar DNI
                    </button>
                  </p>
                )}
              </Field>

              <div className='grid gap-4 sm:grid-cols-2'>
                <Field>
                  <FieldLabel htmlFor='new-appointment-doctor'>Médico *</FieldLabel>
                  <Select
                    items={bookable.map((d) => ({ value: d.id, label: doctorLabel(d) }))}
                    value={doctorId || null}
                    onValueChange={(value) => {
                      setDoctorId(value ?? '');
                      setServiceId('');
                      setSlot(null);
                    }}
                  >
                    <SelectTrigger id='new-appointment-doctor' className='w-full'>
                      <SelectValue placeholder='Elegí un médico' />
                    </SelectTrigger>
                    <SelectContent>
                      {bookable.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {doctorLabel(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {doctors.isError && (
                    <p role='alert' className='text-destructive text-sm'>
                      No se pudieron cargar los médicos.{' '}
                      <button
                        type='button'
                        className='underline'
                        onClick={() => void doctors.refetch()}
                      >
                        Reintentar
                      </button>
                    </p>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor='new-appointment-service'>Servicio *</FieldLabel>
                  <Select
                    items={services.map((s) => ({
                      value: s.id,
                      label: `${s.name} (${s.durationMin} min)`
                    }))}
                    value={serviceId || null}
                    disabled={!doctor}
                    onValueChange={(value) => {
                      setServiceId(value ?? '');
                      setSlot(null);
                    }}
                  >
                    <SelectTrigger id='new-appointment-service' className='w-full'>
                      <SelectValue
                        placeholder={doctor ? 'Elegí un servicio' : 'Primero el médico'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.durationMin} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor='new-appointment-date'>Día *</FieldLabel>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='icon-sm'
                    aria-label='Día anterior'
                    disabled={date <= today}
                    onClick={() => {
                      setDate(addDaysLocal(date, -1));
                      setSlot(null);
                    }}
                  >
                    <Icons.chevronLeft />
                  </Button>
                  <Input
                    id='new-appointment-date'
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
                    onClick={() => {
                      setDate(addDaysLocal(date, 1));
                      setSlot(null);
                    }}
                  >
                    <Icons.chevronRight />
                  </Button>
                  <span className='text-muted-foreground ml-2 text-sm capitalize'>
                    {format(parseISO(`${date}T00:00:00`), 'EEEE d/MM', { locale: es })}
                  </span>
                </div>
              </Field>

              <Field>
                <FieldLabel>Horario *</FieldLabel>
                {!doctor || !serviceId ? (
                  <p className='text-muted-foreground text-sm'>Elegí médico y servicio.</p>
                ) : slots.isLoading ? (
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
                    <button
                      type='button'
                      className='underline'
                      onClick={() => void slots.refetch()}
                    >
                      Reintentar
                    </button>
                  </p>
                ) : (slots.data?.slots.length ?? 0) === 0 ? (
                  <p className='text-muted-foreground text-sm'>
                    Sin horarios libres ese día.{' '}
                    <button
                      type='button'
                      className='text-foreground underline'
                      onClick={() => setDate(addDaysLocal(date, 1))}
                    >
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

              <Field>
                <FieldLabel htmlFor='new-appointment-notes'>Notas</FieldLabel>
                <Textarea
                  id='new-appointment-notes'
                  value={notes}
                  maxLength={500}
                  rows={2}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <LoadingButton loading={create.isPending} disabled={!canSubmit} onClick={submit}>
              {slot ? `Reservar ${slot.start}` : 'Reservar turno'}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PatientFormDialog
        open={!!patientDialog}
        onOpenChange={(next) => !next && setPatientDialog(null)}
        patient={patientDialog?.patient}
        initialQuery={patientDialog?.query}
        onSaved={setPatient}
      />
    </>
  );
}

function PatientPicker({
  onPick,
  onCreate
}: {
  onPick: (patient: Patient) => void;
  onCreate: (query: string) => void;
}) {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q.trim(), 300);
  const search = useQuery(patientSearchQueryOptions(debounced));
  const rows = (search.data ?? []).slice(0, 6);
  const searching = debounced.length >= 2;

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex gap-2'>
        <div className='relative flex-1'>
          <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Nombre, teléfono o DNI'
            aria-label='Buscar paciente'
            className='pl-8'
            autoFocus
          />
        </div>
        <Button variant='outline' onClick={() => onCreate(q)}>
          <Icons.add className='mr-1 h-4 w-4' /> Nuevo paciente
        </Button>
      </div>
      {searching &&
        (search.isLoading ? (
          <Skeleton className='h-9 w-full' />
        ) : search.isError ? (
          <p role='alert' className='text-destructive text-sm'>
            No se pudo buscar.
          </p>
        ) : rows.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            No hay pacientes con ese dato.{' '}
            <button type='button' className='text-foreground underline' onClick={() => onCreate(q)}>
              Cargar uno nuevo
            </button>
          </p>
        ) : (
          <ul className='divide-y rounded-lg border'>
            {rows.map((p) => (
              <li key={p.id}>
                <button
                  type='button'
                  className='hover:bg-muted focus-visible:bg-muted w-full px-3 py-2 text-left text-sm outline-none'
                  onClick={() => onPick(p)}
                >
                  <span className='font-medium'>{p.name}</span>
                  <span className='text-muted-foreground'>
                    {' '}
                    · {p.phone}
                    {p.dni ? ` · DNI ${p.dni}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
