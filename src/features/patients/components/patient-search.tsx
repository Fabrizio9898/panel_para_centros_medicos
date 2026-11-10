'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/use-debounce';
import { StatusBadge } from '@/features/appointments/components/status-badge';
import {
  patientHistoryQueryOptions,
  patientSearchQueryOptions
} from '@/features/appointments/api/queries';
import type { Patient } from '@/features/appointments/api/types';

export function PatientSearch() {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q.trim(), 300);
  const enabled = debounced.length >= 2;
  const search = useQuery(patientSearchQueryOptions(debounced));
  const [selected, setSelected] = useState<Patient | null>(null);
  const rows = search.data ?? [];

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='relative max-w-md'>
        <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Buscar por nombre, teléfono o DNI'
          aria-label='Buscar paciente'
          className='pl-8'
        />
      </div>

      {!enabled ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Buscar un paciente</EmptyTitle>
            <EmptyDescription>
              Escribí al menos 2 caracteres del nombre, teléfono o DNI.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : search.isLoading ? (
        <div className='space-y-2 rounded-lg border p-4'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-10 w-full' />
          ))}
        </div>
      ) : search.isError ? (
        <p className='text-muted-foreground rounded-lg border p-8 text-center text-sm'>
          No se pudo buscar. Reintentá en unos segundos.
        </p>
      ) : rows.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Sin resultados</EmptyTitle>
            <EmptyDescription>No encontramos pacientes con ese dato.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead className='w-40' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className='font-medium'>{patient.name}</TableCell>
                  <TableCell>{patient.phone}</TableCell>
                  <TableCell>{patient.dni ?? '—'}</TableCell>
                  <TableCell>
                    <Button variant='outline' size='sm' onClick={() => setSelected(patient)}>
                      Ver historial
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PatientHistoryDialog patient={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PatientHistoryDialog({
  patient,
  onClose
}: {
  patient: Patient | null;
  onClose: () => void;
}) {
  const history = useQuery(patientHistoryQueryOptions(patient?.id ?? ''));

  return (
    <Dialog open={!!patient} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{patient?.name}</DialogTitle>
          <DialogDescription>
            {patient?.phone}
            {patient?.dni ? ` · DNI ${patient.dni}` : ''} · Historial de turnos
          </DialogDescription>
        </DialogHeader>

        <div className='max-h-[60vh] overflow-y-auto'>
          {history.isLoading ? (
            <div className='space-y-2'>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className='h-9 w-full' />
              ))}
            </div>
          ) : history.isError ? (
            <p className='text-muted-foreground text-sm'>No se pudo cargar el historial.</p>
          ) : history.data && history.data.appointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data.appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{appointment.localDate}</TableCell>
                    <TableCell className='tabular-nums'>{appointment.localTime}</TableCell>
                    <TableCell>{appointment.doctor.name}</TableCell>
                    <TableCell>{appointment.service.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={appointment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className='border'>
              <EmptyHeader>
                <EmptyTitle>Sin turnos</EmptyTitle>
                <EmptyDescription>Este paciente todavía no tiene turnos.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
