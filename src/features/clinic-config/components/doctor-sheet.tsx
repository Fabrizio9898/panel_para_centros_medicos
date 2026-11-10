'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { AlertModal } from '@/components/modal/alert-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAppForm } from '@/lib/form';
import { useSaveDoctor, useSetDoctorActive } from '../api/mutations';
import { configDoctorsQueryOptions, specialtiesQueryOptions } from '../api/queries';
import type { ConfigDoctor } from '../api/types';
import { ScheduleEditor } from './schedule-editor';
import { ServicesEditor } from './services-editor';

const doctorSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre del médico'),
  specialtyIds: z.array(z.string()),
  requiresDni: z.boolean()
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

const emptyValues: DoctorFormValues = { name: '', specialtyIds: [], requiresDni: false };

function valuesOf(doctor: ConfigDoctor | null): DoctorFormValues {
  return doctor
    ? { name: doctor.name, specialtyIds: doctor.specialtyIds, requiresDni: doctor.requiresDni }
    : emptyValues;
}

export type DoctorSheetProps = {
  /** id del médico a editar, 'new' para crear, null cerrado. */
  doctorId: string | null;
  onDoctorIdChange: (id: string | null) => void;
};

export function DoctorSheet({ doctorId, onDoctorIdChange }: DoctorSheetProps) {
  const doctors = useQuery(configDoctorsQueryOptions());
  const specialties = useQuery(specialtiesQueryOptions());
  const save = useSaveDoctor();
  const setActive = useSetDoctorActive();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const isNew = doctorId === 'new';
  const doctor = isNew ? null : (doctors.data?.find((d) => d.id === doctorId) ?? null);

  const form = useAppForm({
    defaultValues: valuesOf(doctor),
    validators: { onSubmit: doctorSchema },
    onSubmit: async ({ value }) => {
      const saved = await save.mutateAsync({
        id: doctor?.id,
        payload: {
          name: value.name.trim(),
          specialtyIds: value.specialtyIds,
          requiresDni: value.requiresDni
        }
      });
      // Recién creado: seguimos en el mismo panel para cargar servicios y horario.
      if (isNew) onDoctorIdChange(saved.id);
    }
  });

  // Reset al cambiar de médico (no en cada refetch).
  const resetKey = isNew ? 'new' : (doctor?.id ?? '');
  useEffect(() => {
    if (doctorId) form.reset(valuesOf(doctor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return (
    <>
      <Sheet open={!!doctorId} onOpenChange={(open) => !open && onDoctorIdChange(null)}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-2xl'>
          <SheetHeader>
            <SheetTitle className='flex items-center gap-2'>
              {isNew ? 'Nuevo médico' : (doctor?.name ?? 'Médico')}
              {doctor && !doctor.active && <Badge variant='secondary'>Inactivo</Badge>}
            </SheetTitle>
          </SheetHeader>

          <div className='flex flex-col gap-6 px-4 pb-6'>
            <section className='space-y-3'>
              <h3 className='text-sm font-semibold'>Datos</h3>
              <form
                id='doctor-form'
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <FieldGroup>
                  <form.AppField
                    name='name'
                    children={(field) => (
                      <field.TextField
                        label='Nombre'
                        required
                        placeholder='Dra. Ana Pérez'
                        autoComplete='off'
                      />
                    )}
                  />
                  <form.AppField
                    name='specialtyIds'
                    children={(field) => (
                      <field.CheckboxGroupField
                        label='Especialidades'
                        options={(specialties.data ?? []).map((s) => ({
                          value: s.id,
                          label: s.name
                        }))}
                      />
                    )}
                  />
                  {specialties.data?.length === 0 && (
                    <p className='text-muted-foreground text-sm'>
                      Todavía no hay especialidades. Cargalas en la pestaña Especialidades.
                    </p>
                  )}
                  <form.AppField
                    name='requiresDni'
                    children={(field) => <field.SwitchField label='Pide DNI para dar turno' />}
                  />
                </FieldGroup>
              </form>
              <div className='flex justify-end'>
                <LoadingButton type='submit' form='doctor-form' loading={save.isPending}>
                  {isNew ? 'Crear médico' : 'Guardar datos'}
                </LoadingButton>
              </div>
            </section>

            {doctor && (
              <>
                <Separator />
                <section className='space-y-3'>
                  <h3 className='text-sm font-semibold'>Servicios</h3>
                  <ServicesEditor doctorId={doctor.id} services={doctor.services} />
                </section>

                <Separator />
                <section className='space-y-3'>
                  <h3 className='text-sm font-semibold'>Horario semanal</h3>
                  <ScheduleEditor doctorId={doctor.id} rules={doctor.schedule} />
                </section>

                <Separator />
                <section className='flex flex-wrap items-center justify-between gap-2'>
                  <p className='text-muted-foreground text-sm'>
                    {doctor.active
                      ? 'Desactivado no aparece para dar turnos. Sus turnos e historial quedan.'
                      : 'Este médico no aparece para dar turnos.'}
                  </p>
                  {doctor.active ? (
                    <Button variant='outline' onClick={() => setConfirmDeactivate(true)}>
                      Desactivar médico
                    </Button>
                  ) : (
                    <LoadingButton
                      variant='outline'
                      loading={setActive.isPending}
                      onClick={() => setActive.mutate({ id: doctor.id, active: true })}
                    >
                      Activar médico
                    </LoadingButton>
                  )}
                </section>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertModal
        isOpen={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() =>
          doctor &&
          setActive.mutate(
            { id: doctor.id, active: false },
            { onSuccess: () => setConfirmDeactivate(false) }
          )
        }
        loading={setActive.isPending}
        title='Desactivar médico'
        description={
          doctor
            ? `${doctor.name} deja de aparecer para dar turnos (también en WhatsApp). Los turnos ya reservados no se cancelan.`
            : ''
        }
        confirmLabel='Desactivar'
      />
    </>
  );
}
