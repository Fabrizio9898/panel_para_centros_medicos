'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { AlertModal } from '@/components/modal/alert-modal';
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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useAppForm } from '@/lib/form';
import {
  doctorsQueryOptions,
  timeOffsQueryOptions
} from '@/features/appointments/api/queries';
import type { TimeOff } from '@/features/appointments/api/types';
import { addDaysLocal, todayLocal } from '@/features/appointments/date-utils';
import { useCreateTimeOff, useDeleteTimeOff } from '@/features/appointments/api/mutations';

const timeOffSchema = z
  .object({
    doctorId: z.string().min(1, 'Elegí un médico'),
    startsAt: z.string().min(1, 'Indicá el inicio'),
    endsAt: z.string().min(1, 'Indicá el fin'),
    reason: z.string().optional()
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: 'El fin tiene que ser posterior al inicio',
    path: ['endsAt']
  });

type TimeOffFormValues = z.infer<typeof timeOffSchema>;

export function TimeOffsBoard() {
  const from = todayLocal();
  const to = addDaysLocal(from, 90);
  const timeOffs = useQuery(timeOffsQueryOptions(from, to));
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TimeOff | null>(null);
  const remove = useDeleteTimeOff();
  const rows = timeOffs.data ?? [];

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setOpen(true)}>
          <Icons.add className='mr-2 h-4 w-4' /> Nueva ausencia
        </Button>
      </div>

      {timeOffs.isLoading ? (
        <div className='space-y-2 rounded-lg border p-4'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-10 w-full' />
          ))}
        </div>
      ) : timeOffs.isError ? (
        <p className='text-muted-foreground rounded-lg border p-8 text-center text-sm'>
          No se pudieron cargar las ausencias.
        </p>
      ) : rows.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Sin ausencias</EmptyTitle>
            <EmptyDescription>
              No hay ausencias cargadas para los próximos 90 días.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Médico</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className='w-10' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((timeOff) => (
                <TableRow key={timeOff.id}>
                  <TableCell className='font-medium'>{timeOff.doctorName}</TableCell>
                  <TableCell>
                    {timeOff.localStartDate} {timeOff.localStartTime}
                  </TableCell>
                  <TableCell>
                    {timeOff.localEndDate} {timeOff.localEndTime}
                  </TableCell>
                  <TableCell>{timeOff.reason ?? '—'}</TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label='Eliminar ausencia'
                      onClick={() => setToDelete(timeOff)}
                    >
                      <Icons.trash />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }
        loading={remove.isPending}
        title='Eliminar ausencia'
        description={
          toDelete
            ? `¿Eliminar la ausencia de ${toDelete.doctorName} del ${toDelete.localStartDate}?`
            : ''
        }
        confirmLabel='Eliminar'
      />

      <NewTimeOffDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function NewTimeOffDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const doctors = useQuery(doctorsQueryOptions());
  const create = useCreateTimeOff();

  const form = useAppForm({
    defaultValues: {
      doctorId: '',
      startsAt: '',
      endsAt: '',
      reason: ''
    } as TimeOffFormValues,
    validators: { onSubmit: timeOffSchema },
    onSubmit: async ({ value }) => {
      await create.mutateAsync({
        doctorId: value.doctorId,
        startsAt: new Date(value.startsAt).toISOString(),
        endsAt: new Date(value.endsAt).toISOString(),
        reason: value.reason || undefined
      });
      form.reset();
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva ausencia</DialogTitle>
          <DialogDescription>Vacaciones o días en los que el médico no atiende.</DialogDescription>
        </DialogHeader>
        <form
          id='time-off-form'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='doctorId'
              children={(field) => (
                <field.SelectField
                  label='Médico'
                  required
                  placeholder='Elegí un médico'
                  options={(doctors.data ?? []).map((doctor) => ({
                    value: doctor.id,
                    label: doctor.name
                  }))}
                />
              )}
            />
            <form.AppField
              name='startsAt'
              children={(field) => (
                <field.TextField label='Desde' required type='datetime-local' />
              )}
            />
            <form.AppField
              name='endsAt'
              children={(field) => (
                <field.TextField label='Hasta' required type='datetime-local' />
              )}
            />
            <form.AppField
              name='reason'
              children={(field) => (
                <field.TextField label='Motivo' placeholder='Vacaciones' />
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <LoadingButton type='submit' form='time-off-form' loading={create.isPending}>
            Guardar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
