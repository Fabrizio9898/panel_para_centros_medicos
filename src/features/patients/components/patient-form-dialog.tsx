'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { useAppForm } from '@/lib/form';
import { useSavePatient } from '@/features/appointments/api/mutations';
import type { Patient } from '@/features/appointments/api/types';

const patientSchema = z.object({
  name: z.string().trim().min(2, 'Ingresá el nombre del paciente'),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'Ingresá el teléfono con código de área'),
  dni: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || /^\d{6,10}$/.test(v.replace(/[.\s-]/g, '')),
      'El DNI tiene que tener entre 6 y 10 números'
    )
});

type PatientFormValues = z.infer<typeof patientSchema>;

export type PatientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si viene, se edita; si no, se crea uno nuevo. */
  patient?: Patient | null;
  /** Para precargar el buscador (si escribieron un nombre o un teléfono). */
  initialQuery?: string;
  onSaved?: (patient: Patient) => void;
};

function initialValues(patient?: Patient | null, initialQuery = ''): PatientFormValues {
  if (patient) return { name: patient.name, phone: patient.phone, dni: patient.dni ?? '' };
  const looksLikePhone = /^[\d\s()+-]{6,}$/.test(initialQuery.trim());
  return {
    name: looksLikePhone ? '' : initialQuery.trim(),
    phone: looksLikePhone ? initialQuery.trim() : '',
    dni: ''
  };
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  initialQuery,
  onSaved
}: PatientFormDialogProps) {
  const save = useSavePatient();
  const editing = !!patient;

  const form = useAppForm({
    defaultValues: initialValues(patient, initialQuery),
    validators: { onSubmit: patientSchema },
    onSubmit: async ({ value }) => {
      const saved = await save.mutateAsync({
        id: patient?.id,
        payload: {
          name: value.name.trim(),
          phone: value.phone.trim(),
          dni: value.dni.trim() === '' ? (editing ? null : undefined) : value.dni.trim()
        }
      });
      onSaved?.(saved);
      onOpenChange(false);
    }
  });

  useEffect(() => {
    if (open) form.reset(initialValues(patient, initialQuery));
  }, [open, patient, initialQuery, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
        </DialogHeader>
        <form
          id='patient-form'
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
                <field.TextField label='Nombre y apellido' required autoComplete='off' />
              )}
            />
            <form.AppField
              name='phone'
              children={(field) => (
                <field.TextField
                  label='Teléfono (WhatsApp)'
                  required
                  type='tel'
                  inputMode='tel'
                  placeholder='11 1234 5678'
                  autoComplete='off'
                />
              )}
            />
            <form.AppField
              name='dni'
              children={(field) => (
                <field.TextField label='DNI' inputMode='numeric' autoComplete='off' />
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <LoadingButton type='submit' form='patient-form' loading={save.isPending}>
            {editing ? 'Guardar cambios' : 'Guardar paciente'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
