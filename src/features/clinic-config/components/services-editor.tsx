'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { useSaveService } from '../api/mutations';
import type { ConfigService } from '../api/types';

type Draft = { name: string; durationMin: string };

function draftError(draft: Draft): string | null {
  if (draft.name.trim().length < 2) return 'Ingresá el nombre del servicio';
  const minutes = Number(draft.durationMin);
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) {
    return 'La duración va de 5 a 480 minutos';
  }
  return null;
}

function ServiceForm({
  initial,
  submitLabel,
  loading,
  onSubmit,
  onCancel
}: {
  initial: Draft;
  submitLabel: string;
  loading: boolean;
  onSubmit: (draft: { name: string; durationMin: number }) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [touched, setTouched] = useState(false);
  const error = draftError(draft);

  return (
    <form
      className='flex flex-col gap-2'
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!error) onSubmit({ name: draft.name.trim(), durationMin: Number(draft.durationMin) });
      }}
    >
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          aria-label='Nombre del servicio'
          placeholder='Consulta'
          className='min-w-[160px] flex-1'
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <div className='flex items-center gap-1'>
          <Input
            aria-label='Duración en minutos'
            type='number'
            inputMode='numeric'
            min={5}
            max={480}
            step={5}
            className='w-[90px]'
            value={draft.durationMin}
            onChange={(e) => setDraft({ ...draft, durationMin: e.target.value })}
          />
          <span className='text-muted-foreground text-sm'>min</span>
        </div>
        <LoadingButton type='submit' size='sm' loading={loading}>
          {submitLabel}
        </LoadingButton>
        {onCancel && (
          <Button type='button' variant='ghost' size='sm' onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
      {touched && error && (
        <p role='alert' className='text-destructive text-sm'>
          {error}
        </p>
      )}
    </form>
  );
}

export function ServicesEditor({
  doctorId,
  services
}: {
  doctorId: string;
  services: ConfigService[];
}) {
  const save = useSaveService();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(services.length === 0);

  return (
    <div className='space-y-3'>
      {services.length > 0 && (
        <ul className='divide-y rounded-lg border'>
          {services.map((service) => (
            <li key={service.id} className='p-3'>
              {editingId === service.id ? (
                <ServiceForm
                  initial={{ name: service.name, durationMin: String(service.durationMin) }}
                  submitLabel='Guardar'
                  loading={save.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(payload) =>
                    save.mutate(
                      { id: service.id, doctorId, payload },
                      { onSuccess: () => setEditingId(null) }
                    )
                  }
                />
              ) : (
                <div className='flex flex-wrap items-center gap-2'>
                  <div className='flex-1 text-sm'>
                    <span className='font-medium'>{service.name}</span>
                    <span className='text-muted-foreground'> · {service.durationMin} min</span>
                    {!service.active && (
                      <Badge variant='secondary' className='ml-2'>
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    aria-label={`Editar ${service.name}`}
                    onClick={() => setEditingId(service.id)}
                  >
                    <Icons.edit className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    disabled={save.isPending}
                    onClick={() =>
                      save.mutate({
                        id: service.id,
                        doctorId,
                        payload: { active: !service.active }
                      })
                    }
                  >
                    {service.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className='rounded-lg border p-3'>
          <ServiceForm
            initial={{ name: '', durationMin: '30' }}
            submitLabel='Agregar'
            loading={save.isPending}
            onCancel={services.length > 0 ? () => setAdding(false) : undefined}
            onSubmit={(payload) =>
              save.mutate({ doctorId, payload }, { onSuccess: () => setAdding(false) })
            }
          />
        </div>
      ) : (
        <Button variant='outline' size='sm' onClick={() => setAdding(true)}>
          <Icons.add className='mr-1 h-4 w-4' /> Agregar servicio
        </Button>
      )}
    </div>
  );
}
