'use client';

import { useEffect, useState } from 'react';
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
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
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
import { useDeleteSpecialty, useSaveSpecialty } from '../api/mutations';
import { specialtiesQueryOptions } from '../api/queries';
import type { Specialty } from '../api/types';

const specialtySchema = z.object({
  name: z.string().trim().min(2, 'Ingresá un nombre de al menos 2 letras')
});

export function SpecialtiesTab() {
  const specialties = useQuery(specialtiesQueryOptions());
  const remove = useDeleteSpecialty();
  const [editing, setEditing] = useState<{ specialty: Specialty | null } | null>(null);
  const [toDelete, setToDelete] = useState<Specialty | null>(null);
  const rows = specialties.data ?? [];

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setEditing({ specialty: null })}>
          <Icons.add className='mr-1 h-4 w-4' /> Nueva especialidad
        </Button>
      </div>

      {specialties.isLoading ? (
        <Skeleton className='h-32 w-full' />
      ) : specialties.isError ? (
        <QueryError
          error={specialties.error}
          onRetry={() => void specialties.refetch()}
          message='No se pudieron cargar las especialidades.'
        />
      ) : rows.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Todavía no hay especialidades</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Especialidad</TableHead>
                <TableHead>Médicos</TableHead>
                <TableHead className='w-24' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((specialty) => (
                <TableRow key={specialty.id}>
                  <TableCell className='font-medium'>{specialty.name}</TableCell>
                  <TableCell>{specialty.doctorCount}</TableCell>
                  <TableCell className='text-right whitespace-nowrap'>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Renombrar ${specialty.name}`}
                      onClick={() => setEditing({ specialty })}
                    >
                      <Icons.edit />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={`Eliminar ${specialty.name}`}
                      onClick={() => setToDelete(specialty)}
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

      <SpecialtyDialog
        open={!!editing}
        specialty={editing?.specialty ?? null}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <AlertModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() =>
          toDelete && remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }
        loading={remove.isPending}
        title='Eliminar especialidad'
        description={
          toDelete
            ? toDelete.doctorCount > 0
              ? `${toDelete.name} se va a quitar de ${toDelete.doctorCount} ${toDelete.doctorCount === 1 ? 'médico' : 'médicos'}. Los médicos y sus turnos no se borran.`
              : `¿Eliminar ${toDelete.name}?`
            : ''
        }
        confirmLabel='Eliminar'
      />
    </div>
  );
}

function SpecialtyDialog({
  open,
  specialty,
  onOpenChange
}: {
  open: boolean;
  specialty: Specialty | null;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSaveSpecialty();
  const form = useAppForm({
    defaultValues: { name: specialty?.name ?? '' },
    validators: { onSubmit: specialtySchema },
    onSubmit: async ({ value }) => {
      await save.mutateAsync({ id: specialty?.id, name: value.name.trim() });
      onOpenChange(false);
    }
  });

  useEffect(() => {
    if (open) form.reset({ name: specialty?.name ?? '' });
  }, [open, specialty, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{specialty ? 'Renombrar especialidad' : 'Nueva especialidad'}</DialogTitle>
        </DialogHeader>
        <form
          id='specialty-form'
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
                <field.TextField label='Nombre' required placeholder='Cardiología' />
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <LoadingButton type='submit' form='specialty-form' loading={save.isPending}>
            Guardar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
