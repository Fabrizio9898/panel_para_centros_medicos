'use client';

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
import { useInviteMember } from '../api/mutations';
import type { InviteRole } from '../api/types';

const inviteSchema = z.object({
  email: z.string().trim().min(1, 'Ingresá el email').email('Email inválido'),
  role: z.enum(['clinic_admin', 'receptionist'], { message: 'Elegí un rol' })
});

type InviteFormValues = z.infer<typeof inviteSchema>;

const ROLE_OPTIONS: { value: InviteRole; label: string }[] = [
  { value: 'clinic_admin', label: 'Admin' },
  { value: 'receptionist', label: 'Recepción' }
];

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const invite = useInviteMember();

  const form = useAppForm({
    defaultValues: { email: '', role: 'receptionist' } as InviteFormValues,
    validators: { onSubmit: inviteSchema },
    onSubmit: async ({ value }) => {
      try {
        await invite.mutateAsync({ email: value.email.trim(), role: value.role });
      } catch {
        // el toast de error lo muestra la mutación
        return;
      }
      form.reset();
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar al equipo</DialogTitle>
        </DialogHeader>
        <form
          id='invite-form'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='email'
              children={(field) => (
                <field.TextField
                  label='Email'
                  required
                  type='email'
                  placeholder='nombre@clinica.com'
                />
              )}
            />
            <form.AppField
              name='role'
              children={(field) => (
                <field.SelectField
                  label='Rol'
                  required
                  placeholder='Elegí un rol'
                  options={ROLE_OPTIONS}
                />
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <LoadingButton type='submit' form='invite-form' loading={invite.isPending}>
            Enviar invitación
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
