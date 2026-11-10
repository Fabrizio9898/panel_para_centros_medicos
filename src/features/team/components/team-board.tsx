'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryError } from '@/components/feedback/query-error';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { roleLabel } from '@/features/account/constants';
import { formatClinicDate } from '@/features/appointments/date-utils';
import { useInviteMember, useRemoveMember, useRevokeInvitation } from '../api/mutations';
import { teamQueryOptions } from '../api/queries';
import type { TeamInvitation, TeamMember } from '../api/types';

/** Para mandar la invitación por WhatsApp cuando el mail cae en spam. */
export async function copyInviteLink(url: string) {
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Link copiado. Pegalo en WhatsApp.');
  } catch {
    toast.error('No se pudo copiar el link');
  }
}

function CopyLinkButton({ url }: { url: string }) {
  return (
    <Button variant='outline' size='sm' className='mr-1' onClick={() => void copyInviteLink(url)}>
      <Icons.share className='mr-1 h-4 w-4' /> Copiar link
    </Button>
  );
}

export function TeamBoard() {
  const team = useQuery(teamQueryOptions());
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);
  const [toRevoke, setToRevoke] = useState<TeamInvitation | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const remove = useRemoveMember();
  const revoke = useRevokeInvitation();
  const resend = useInviteMember();

  if (team.isLoading) {
    return (
      <div className='space-y-2 rounded-lg border p-4'>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className='h-10 w-full' />
        ))}
      </div>
    );
  }

  if (team.isError || !team.data) {
    return (
      <QueryError
        error={team.error}
        onRetry={() => void team.refetch()}
        message='No se pudo cargar el equipo.'
      />
    );
  }

  const { members, invitations } = team.data;

  return (
    <div className='flex flex-1 flex-col gap-8'>
      <section className='space-y-3'>
        <h2 className='text-base font-semibold'>Miembros</h2>
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Alta</TableHead>
                <TableHead className='w-40' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className='font-medium'>{member.name ?? member.email}</div>
                    {member.name && (
                      <div className='text-muted-foreground text-xs'>{member.email}</div>
                    )}
                  </TableCell>
                  <TableCell>{roleLabel(member.role)}</TableCell>
                  <TableCell>{formatClinicDate(member.createdAt)}</TableCell>
                  <TableCell className='text-right'>
                    {member.removable && (
                      <Button variant='ghost' size='sm' onClick={() => setToRemove(member)}>
                        Quitar acceso
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className='space-y-3'>
        <h2 className='text-base font-semibold'>Invitaciones pendientes</h2>
        {invitations.length === 0 ? (
          <p className='text-muted-foreground rounded-lg border p-4 text-sm'>
            No hay invitaciones pendientes.
          </p>
        ) : (
          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Invitado el</TableHead>
                  <TableHead>Vence el</TableHead>
                  <TableHead className='w-48' />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className='font-medium'>{invitation.email}</TableCell>
                    <TableCell>{roleLabel(invitation.role)}</TableCell>
                    <TableCell>{formatClinicDate(invitation.invitedAt)}</TableCell>
                    <TableCell>
                      <span className='mr-2'>{formatClinicDate(invitation.expiresAt)}</span>
                      {invitation.expired && <Badge variant='destructive'>Vencida</Badge>}
                    </TableCell>
                    <TableCell className='text-right whitespace-nowrap'>
                      {invitation.inviteUrl && <CopyLinkButton url={invitation.inviteUrl} />}
                      <Button
                        variant='ghost'
                        size='sm'
                        disabled={resend.isPending}
                        onClick={() => {
                          setResendingId(invitation.id);
                          resend.mutate(
                            { email: invitation.email, role: invitation.role },
                            { onSettled: () => setResendingId(null) }
                          );
                        }}
                      >
                        {resendingId === invitation.id ? 'Reenviando…' : 'Reenviar'}
                      </Button>
                      <Button variant='ghost' size='sm' onClick={() => setToRevoke(invitation)}>
                        Revocar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <AlertModal
        isOpen={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={() =>
          toRemove && remove.mutate(toRemove.id, { onSettled: () => setToRemove(null) })
        }
        loading={remove.isPending}
        title='Quitar acceso'
        description={toRemove ? `¿Quitarle el acceso a ${toRemove.name ?? toRemove.email}?` : ''}
        confirmLabel='Quitar acceso'
      />

      <AlertModal
        isOpen={!!toRevoke}
        onClose={() => setToRevoke(null)}
        onConfirm={() =>
          toRevoke && revoke.mutate(toRevoke.id, { onSettled: () => setToRevoke(null) })
        }
        loading={revoke.isPending}
        title='Revocar invitación'
        description={toRevoke ? `¿Revocar la invitación a ${toRevoke.email}?` : ''}
        confirmLabel='Revocar'
      />
    </div>
  );
}
