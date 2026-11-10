'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { QueryError } from '@/components/feedback/query-error';
import { AlertModal } from '@/components/modal/alert-modal';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import { useCreateClosure, useDeleteClosure } from '@/features/appointments/api/mutations';
import { closuresQueryOptions } from '@/features/appointments/api/queries';
import type { Closure } from '@/features/appointments/api/types';
import { todayLocal } from '@/features/appointments/date-utils';

const closureSchema = z
  .object({
    startDate: z.string().min(1, 'Indicá desde qué día'),
    endDate: z.string().min(1, 'Indicá hasta qué día'),
    reason: z.string().optional()
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: 'El último día tiene que ser igual o posterior al primero',
    path: ['endDate']
  });

type ClosureFormValues = z.infer<typeof closureSchema>;

/** Feriados y cierres del centro completo: ningún médico atiende esos días. */
export function ClosuresBoard() {
  const closures = useQuery(closuresQueryOptions());
  const remove = useDeleteClosure();
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Closure | null>(null);
  const rows = closures.data ?? [];

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setOpen(true)}>
          <Icons.add className='mr-2 h-4 w-4' /> Nuevo feriado o cierre
        </Button>
      </div>

      {closures.isLoading ? (
        <Skeleton className='h-32 w-full' />
      ) : closures.isError ? (
        <QueryError
          error={closures.error}
          onRetry={() => void closures.refetch()}
          message='No se pudieron cargar los cierres.'
        />
      ) : rows.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Sin feriados ni cierres</EmptyTitle>
            <EmptyDescription>
              Los días cargados acá no se ofrecen para turnos, para ningún médico.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Desde</TableHead>
                <TableHead>Hasta</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className='w-10' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((closure) => (
                <TableRow key={closure.id}>
                  <TableCell className='font-medium'>{closure.startDate}</TableCell>
                  <TableCell>{closure.endDate}</TableCell>
                  <TableCell>{closure.reason ?? '—'}</TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label='Eliminar cierre'
                      onClick={() => setToDelete(closure)}
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
        title='Eliminar cierre'
        description={
          toDelete
            ? `¿Eliminar el cierre del ${toDelete.startDate}${toDelete.endDate !== toDelete.startDate ? ` al ${toDelete.endDate}` : ''}? Esos días vuelven a tener turnos.`
            : ''
        }
        confirmLabel='Eliminar'
      />

      <NewClosureDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function NewClosureDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateClosure();
  const form = useAppForm({
    defaultValues: { startDate: '', endDate: '', reason: '' } as ClosureFormValues,
    validators: { onSubmit: closureSchema },
    onSubmit: async ({ value }) => {
      await create.mutateAsync({
        startDate: value.startDate,
        endDate: value.endDate,
        reason: value.reason?.trim() || undefined
      });
      form.reset();
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo feriado o cierre</DialogTitle>
        </DialogHeader>
        <form
          id='closure-form'
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='startDate'
              children={(field) => (
                <field.TextField label='Desde' required type='date' min={todayLocal()} />
              )}
            />
            <form.AppField
              name='endDate'
              children={(field) => (
                <field.TextField label='Hasta (incluido)' required type='date' min={todayLocal()} />
              )}
            />
            <form.AppField
              name='reason'
              children={(field) => <field.TextField label='Motivo' placeholder='Feriado' />}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <LoadingButton type='submit' form='closure-form' loading={create.isPending}>
            Guardar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
