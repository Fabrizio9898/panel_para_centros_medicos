'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryStates } from 'nuqs';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertModal } from '@/components/modal/alert-modal';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useUpdateAppointmentStatus } from '../api/mutations';
import { appointmentsQueryOptions, doctorsQueryOptions } from '../api/queries';
import type { Appointment } from '../api/types';
import { CLOSED_STATUSES, STATUS_OPTIONS } from '../constants';
import { addDaysLocal, rangeFor, todayLocal } from '../date-utils';
import { StatusBadge } from './status-badge';

export function AppointmentsBoard() {
  const [filters, setFilters] = useQueryStates({
    date: parseAsString.withDefault(todayLocal()),
    view: parseAsString.withDefault('day'),
    doctorId: parseAsString,
    status: parseAsString
  });

  const view = filters.view === 'week' ? 'week' : 'day';
  const range = rangeFor(filters.date, view);
  const appointments = useQuery(
    appointmentsQueryOptions({
      from: range.from,
      to: range.to,
      doctorId: filters.doctorId,
      status: filters.status
    })
  );
  const doctors = useQuery(doctorsQueryOptions());
  const rows = appointments.data ?? [];

  const dateLabel =
    view === 'week'
      ? `${format(parseISO(range.from), 'dd/MM')} al ${format(parseISO(range.to), 'dd/MM')}`
      : format(parseISO(range.from), 'EEEE dd/MM/yyyy', { locale: es });

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Anterior'
            onClick={() =>
              setFilters({ date: addDaysLocal(filters.date, view === 'week' ? -7 : -1) })
            }
          >
            <Icons.chevronLeft />
          </Button>
          <Input
            type='date'
            aria-label='Fecha'
            className='w-[150px]'
            value={filters.date}
            onChange={(e) => e.target.value && setFilters({ date: e.target.value })}
          />
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Siguiente'
            onClick={() =>
              setFilters({ date: addDaysLocal(filters.date, view === 'week' ? 7 : 1) })
            }
          >
            <Icons.chevronRight />
          </Button>
        </div>

        <div className='inline-flex rounded-lg border p-0.5'>
          <Button
            size='sm'
            variant={view === 'day' ? 'default' : 'ghost'}
            onClick={() => setFilters({ view: 'day' })}
          >
            Día
          </Button>
          <Button
            size='sm'
            variant={view === 'week' ? 'default' : 'ghost'}
            onClick={() => setFilters({ view: 'week' })}
          >
            Semana
          </Button>
        </div>

        <Select
          value={filters.doctorId ?? 'all'}
          onValueChange={(value) =>
            setFilters({ doctorId: !value || value === 'all' ? null : value })
          }
        >
          <SelectTrigger className='w-[210px]'>
            <SelectValue placeholder='Todos los médicos' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos los médicos</SelectItem>
            {doctors.data?.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                {doctor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status ?? 'all'}
          onValueChange={(value) =>
            setFilters({ status: !value || value === 'all' ? null : value })
          }
        >
          <SelectTrigger className='w-[170px]'>
            <SelectValue placeholder='Todos los estados' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos los estados</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant='outline' size='sm' onClick={() => setFilters({ date: todayLocal() })}>
          Hoy
        </Button>
        <span className='text-muted-foreground ml-auto text-sm capitalize'>{dateLabel}</span>
      </div>

      {appointments.isLoading ? (
        <div className='space-y-2 rounded-lg border p-4'>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='h-10 w-full' />
          ))}
        </div>
      ) : appointments.isError ? (
        <div className='flex flex-col items-center gap-3 rounded-lg border p-8 text-center'>
          <p className='text-muted-foreground text-sm'>No se pudieron cargar los turnos.</p>
          <Button variant='outline' size='sm' onClick={() => void appointments.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>No hay turnos</EmptyTitle>
            <EmptyDescription>
              No hay turnos para {view === 'week' ? 'esta semana' : 'este día'} con los filtros
              elegidos.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                {view === 'week' && <TableHead>Fecha</TableHead>}
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className='w-10' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((appointment) => (
                <TableRow key={appointment.id}>
                  {view === 'week' && <TableCell>{appointment.localDate}</TableCell>}
                  <TableCell className='font-medium tabular-nums'>
                    {appointment.localTime}
                  </TableCell>
                  <TableCell>
                    <div className='font-medium'>{appointment.patient.name}</div>
                    <div className='text-muted-foreground text-xs'>
                      {appointment.patient.phone}
                      {appointment.patient.dni ? ` · DNI ${appointment.patient.dni}` : ''}
                    </div>
                  </TableCell>
                  <TableCell>{appointment.doctor.name}</TableCell>
                  <TableCell>{appointment.service.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={appointment.status} />
                  </TableCell>
                  <TableCell>
                    <AppointmentActions appointment={appointment} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function AppointmentActions({ appointment }: { appointment: Appointment }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const update = useUpdateAppointmentStatus();
  const closed = CLOSED_STATUSES.includes(appointment.status);

  return (
    <>
      <AlertModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() =>
          update.mutate(
            { id: appointment.id, status: 'cancelled' },
            { onSuccess: () => setCancelOpen(false) }
          )
        }
        loading={update.isPending}
        title='Cancelar turno'
        description={`¿Cancelar el turno de ${appointment.patient.name} del ${appointment.localDate} a las ${appointment.localTime}?`}
        confirmLabel='Cancelar turno'
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger render={<Button variant='ghost' size='icon-sm' />}>
          <span className='sr-only'>Acciones</span>
          <Icons.ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Turno</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={closed}
            onClick={() => update.mutate({ id: appointment.id, status: 'attended' })}
          >
            <Icons.circleCheck className='mr-2 h-4 w-4' /> Asistió
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={closed}
            onClick={() => update.mutate({ id: appointment.id, status: 'no_show' })}
          >
            <Icons.close className='mr-2 h-4 w-4' /> No vino
          </DropdownMenuItem>
          <DropdownMenuItem disabled={closed} onClick={() => setCancelOpen(true)}>
            <Icons.xCircle className='mr-2 h-4 w-4' /> Cancelar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
