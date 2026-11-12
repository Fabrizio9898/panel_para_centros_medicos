'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { QueryError } from '@/components/feedback/query-error';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
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
import { useSaveHealthInsurance } from '../api/mutations';
import { healthInsurancesQueryOptions } from '../api/queries';
import type { HealthInsurance } from '../api/types';

const insuranceSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá un nombre de al menos 2 letras')
});

export type InsuranceListTabProps = { canManage: boolean };

export function InsuranceListTab({ canManage }: InsuranceListTabProps) {
  const insurances = useQuery(healthInsurancesQueryOptions());
  const save = useSaveHealthInsurance();
  const [editing, setEditing] = useState<{ insurance: HealthInsurance | null } | null>(null);
  const rows = insurances.data ?? [];

  return (
    <div className='flex flex-col gap-4'>
      {canManage && (
        <div className='flex justify-end'>
          <Button onClick={() => setEditing({ insurance: null })}>
            <Icons.add className='mr-1 h-4 w-4' /> Nueva obra social
          </Button>
        </div>
      )}

      {insurances.isLoading ? (
        <Skeleton className='h-32 w-full' />
      ) : insurances.isError ? (
        <QueryError
          error={insurances.error}
          onRetry={() => void insurances.refetch()}
          message='No se pudieron cargar las obras sociales.'
        />
      ) : rows.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Todavía no hay obras sociales</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Obra social</TableHead>
                <TableHead>Estado</TableHead>
                {canManage && <TableHead className='w-24' />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((insurance) => (
                <TableRow key={insurance.id}>
                  <TableCell className='font-medium'>{insurance.name}</TableCell>
                  <TableCell>
                    <Badge variant={insurance.active ? 'secondary' : 'outline'}>
                      {insurance.active ? 'Activa' : 'Dada de baja'}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className='text-right whitespace-nowrap'>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        aria-label={`Renombrar ${insurance.name}`}
                        onClick={() => setEditing({ insurance })}
                      >
                        <Icons.edit />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        disabled={save.isPending}
                        onClick={() => save.mutate({ id: insurance.id, active: !insurance.active })}
                      >
                        {insurance.active ? 'Dar de baja' : 'Activar'}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InsuranceDialog
        open={!!editing}
        insurance={editing?.insurance ?? null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}

function InsuranceDialog({
  open,
  insurance,
  onOpenChange
}: {
  open: boolean;
  insurance: HealthInsurance | null;
  onOpenChange: (open: boolean) => void;
}) {
  const save = useSaveHealthInsurance();
  const form = useAppForm({
    defaultValues: { name: insurance?.name ?? '' },
    validators: { onSubmit: insuranceSchema },
    onSubmit: async ({ value }) => {
      await save.mutateAsync({ id: insurance?.id, name: value.name.trim() });
      onOpenChange(false);
    }
  });

  useEffect(() => {
    if (open) form.reset({ name: insurance?.name ?? '' });
  }, [open, insurance, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{insurance ? 'Renombrar obra social' : 'Nueva obra social'}</DialogTitle>
        </DialogHeader>
        <form
          id='insurance-form'
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='name'
              children={(field) => <field.TextField label='Nombre' required placeholder='OSDE' />}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <LoadingButton type='submit' form='insurance-form' loading={save.isPending}>
            Guardar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
