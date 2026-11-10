'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { QueryError } from '@/components/feedback/query-error';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { appointmentsQueryOptions } from '@/features/appointments/api/queries';
import { NewAppointmentDialog } from '@/features/appointments/components/new-appointment-dialog';
import { StatusBadge } from '@/features/appointments/components/status-badge';
import { todayLocal } from '@/features/appointments/date-utils';

export function Overview() {
  // Reloj que se actualiza cada minuto: "hoy" y "ahora" no quedan congelados.
  const [now, setNow] = useState(() => Date.now());
  const [newOpen, setNewOpen] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const today = todayLocal();
  const appointments = useQuery({
    ...appointmentsQueryOptions({ from: today, to: today }),
    refetchInterval: 60_000
  });

  const data = appointments.data ?? [];
  const notCancelled = data.filter((a) => a.status !== 'cancelled');
  const upcoming = data.filter(
    (a) =>
      (a.status === 'pending' || a.status === 'confirmed') && new Date(a.startsAt).getTime() >= now
  );
  const pending = data.filter((a) => a.status === 'pending');
  const attended = data.filter((a) => a.status === 'attended');
  const noShow = data.filter((a) => a.status === 'no_show');

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Kpi label='Turnos de hoy' value={notCancelled.length} loading={appointments.isLoading} />
        <Kpi
          label='Pendientes de confirmar'
          value={pending.length}
          loading={appointments.isLoading}
        />
        <Kpi label='Asistieron' value={attended.length} loading={appointments.isLoading} />
        <Kpi label='No vinieron' value={noShow.length} loading={appointments.isLoading} />
      </div>

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <div className='flex flex-col gap-3 lg:col-span-2'>
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-medium'>Próximos turnos de hoy</h2>
            <Button
              variant='ghost'
              size='sm'
              nativeButton={false}
              render={<Link href='/dashboard/turnos' aria-label='Ver agenda' />}
            >
              Ver agenda <Icons.arrowRight className='ml-1 h-4 w-4' />
            </Button>
          </div>

          {appointments.isLoading ? (
            <div className='space-y-2 rounded-lg border p-4'>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-9 w-full' />
              ))}
            </div>
          ) : appointments.isError ? (
            <QueryError
              error={appointments.error}
              onRetry={() => void appointments.refetch()}
              message='No se pudieron cargar los turnos de hoy.'
            />
          ) : upcoming.length === 0 ? (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyTitle>Sin turnos pendientes</EmptyTitle>
                <EmptyDescription>
                  Cuando un paciente saque un turno por WhatsApp, aparece acá.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className='overflow-x-auto rounded-lg border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.slice(0, 8).map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className='font-medium tabular-nums'>
                        {appointment.localTime}
                      </TableCell>
                      <TableCell>{appointment.patient.name}</TableCell>
                      <TableCell>{appointment.doctor.name}</TableCell>
                      <TableCell>{appointment.service.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className='flex flex-col gap-2'>
          <h2 className='text-sm font-medium'>Accesos rápidos</h2>
          <Button className='justify-start' onClick={() => setNewOpen(true)}>
            <Icons.add className='mr-2 h-4 w-4' /> Nuevo turno
          </Button>
          <NewAppointmentDialog open={newOpen} onOpenChange={setNewOpen} />
          <Button
            variant='outline'
            className='justify-start'
            nativeButton={false}
            render={<Link href='/dashboard/turnos' aria-label='Ver turnos' />}
          >
            <Icons.calendar className='mr-2 h-4 w-4' /> Ver turnos del día y la semana
          </Button>
          <Button
            variant='outline'
            className='justify-start'
            nativeButton={false}
            render={<Link href='/dashboard/pacientes' aria-label='Buscar un paciente' />}
          >
            <Icons.search className='mr-2 h-4 w-4' /> Buscar un paciente
          </Button>
          <Button
            variant='outline'
            className='justify-start'
            nativeButton={false}
            render={<Link href='/dashboard/ausencias' aria-label='Cargar una ausencia' />}
          >
            <Icons.clock className='mr-2 h-4 w-4' /> Cargar una ausencia
          </Button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums'>
          {loading ? <Skeleton className='h-7 w-10' /> : value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
