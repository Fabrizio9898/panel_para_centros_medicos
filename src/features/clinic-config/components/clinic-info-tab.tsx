'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { QueryError } from '@/components/feedback/query-error';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppForm } from '@/lib/form';
import { useUpdateClinicInfo } from '../api/mutations';
import { clinicInfoQueryOptions } from '../api/queries';
import type { ClinicInfo } from '../api/types';

const clinicSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre del centro'),
  address: z.string().trim().max(200, 'La dirección es demasiado larga'),
  phone: z.string().trim().max(40, 'El teléfono es demasiado largo')
});

function valuesOf(info?: ClinicInfo) {
  return { name: info?.name ?? '', address: info?.address ?? '', phone: info?.phone ?? '' };
}

/** Datos que se muestran a los pacientes (el bot de WhatsApp los usa en sus mensajes). */
export function ClinicInfoTab() {
  const info = useQuery(clinicInfoQueryOptions());
  const save = useUpdateClinicInfo();

  const form = useAppForm({
    defaultValues: valuesOf(info.data),
    validators: { onSubmit: clinicSchema },
    onSubmit: async ({ value }) => {
      await save.mutateAsync({
        name: value.name.trim(),
        address: value.address.trim(),
        phone: value.phone.trim()
      });
    }
  });

  // Carga inicial: el form arranca vacío hasta que llegan los datos.
  const loadedKey = info.data ? JSON.stringify(info.data) : '';
  useEffect(() => {
    if (loadedKey) form.reset(valuesOf(JSON.parse(loadedKey) as ClinicInfo));
  }, [loadedKey, form]);

  if (info.isLoading) return <Skeleton className='h-48 w-full max-w-xl' />;
  if (info.isError) {
    return (
      <QueryError
        error={info.error}
        onRetry={() => void info.refetch()}
        message='No se pudieron cargar los datos del centro.'
      />
    );
  }

  return (
    <form
      className='max-w-xl space-y-4'
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField
          name='name'
          children={(field) => <field.TextField label='Nombre del centro' required />}
        />
        <form.AppField
          name='address'
          children={(field) => (
            <field.TextField label='Dirección' placeholder='Av. San Martín 123, Florencio Varela' />
          )}
        />
        <form.AppField
          name='phone'
          children={(field) => (
            <field.TextField label='Teléfono' type='tel' placeholder='11 4255-0000' />
          )}
        />
      </FieldGroup>
      <div className='flex justify-end'>
        <LoadingButton type='submit' loading={save.isPending}>
          Guardar cambios
        </LoadingButton>
      </div>
    </form>
  );
}
