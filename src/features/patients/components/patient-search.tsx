'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryError } from '@/components/feedback/query-error';
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
  patientListQueryOptions
} from '@/features/appointments/api/queries';
import type { Patient } from '@/features/appointments/api/types';
import { PatientFormDialog } from './patient-form-dialog';
import { coverageLabel } from '@/features/health-insurances/coverage-label';

const PAGE = 50;

export function PatientSearch() {
  const [q, setQ] = useState('');
  const debounced = useDebounce(q.trim(), 300);
  const [limit, setLimit] = useState(PAGE);
  const search = useQuery(patientListQueryOptions(debounced, limit));
  const [selected, setSelected] = useState<Patient | null>(null);
  const [editing, setEditing] = useState<{ patient: Patient | null } | null>(null);
  const rows = search.data ?? [];

  return (
    <div className='flex flex-1 flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative w-full max-w-md'>
          <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2' />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
            placeholder='Filtrar por nombre, teléfono o DNI'
            aria-label='Buscar paciente'
            className='pl-8'
          />
        </div>
        <Button className='ml-auto' onClick={() => setEditing({ patient: null })}>
          <Icons.add className='mr-1 h-4 w-4' /> Nuevo paciente
        </Button>
      </div>

      {search.isLoading ? (
        <div className='space-y-2 rounded-lg border p-4'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-10 w-full' />
          ))}
        </div>
      ) : search.isError ? (
        <QueryError
          error={search.error}
          onRetry={() => void search.refetch()}
          message='No se pudo buscar.'
        />
      ) : rows.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>{debounced ? 'Sin resultados' : 'Todavía no hay pacientes'}</EmptyTitle>
            <EmptyDescription>
              {debounced
                ? 'No encontramos pacientes con ese dato.'
                : 'Se cargan solos cuando sacan turno por WhatsApp, o con "Nuevo paciente".'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <ul className='flex flex-col gap-2 md:hidden' aria-label='Pacientes'>
            {rows.map((patient) => (
              <li key={patient.id} className='rounded-lg border p-3'>
                <div className='font-medium break-words'>{patient.name}</div>
                <div className='text-muted-foreground text-xs'>
                  {patient.phone}
                  {patient.dni ? ` · DNI ${patient.dni}` : ''}
                </div>
                <div className='text-muted-foreground text-xs'>
                  {coverageLabel(patient.coverage)}
                </div>
                <div className='mt-2 flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1'
                    onClick={() => setSelected(patient)}
                  >
                    Ver historial
                  </Button>
                  <Button variant='outline' size='sm' onClick={() => setEditing({ patient })}>
                    <Icons.edit className='mr-1 h-4 w-4' /> Editar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className='hidden overflow-x-auto rounded-lg border md:block'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Obra social</TableHead>
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
                      {patient.coverage ? (
                        <>
                          <div>{patient.coverage.name}</div>
                          {patient.coverage.memberNumber && (
                            <div className='text-muted-foreground text-xs'>
                              N° {patient.coverage.memberNumber}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className='text-muted-foreground'>Particular</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => setEditing({ patient })}
                          aria-label={`Editar ${patient.name}`}
                        >
                          <Icons.edit className='h-4 w-4' />
                        </Button>
                        <Button variant='outline' size='sm' onClick={() => setSelected(patient)}>
                          Ver historial
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {rows.length >= limit && limit < 200 && (
        <div className='flex justify-center'>
          <Button
            variant='outline'
            disabled={search.isFetching}
            onClick={() => setLimit((current) => Math.min(current + PAGE, 200))}
          >
            {search.isFetching ? 'Cargando…' : 'Ver más'}
          </Button>
        </div>
      )}

      <PatientHistoryDialog patient={selected} onClose={() => setSelected(null)} />
      <PatientFormDialog
        open={!!editing}
        onOpenChange={(next) => !next && setEditing(null)}
        patient={editing?.patient}
        initialQuery={editing?.patient ? undefined : q}
        onSaved={(patient) => {
          if (!editing?.patient) setQ(patient.name);
        }}
      />
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
            {patient?.dni ? ` · DNI ${patient.dni}` : ''}
            {` · ${patient?.coverage ? patient.coverage.name : 'Particular'}`}
            {patient?.coverage?.memberNumber ? ` N° ${patient.coverage.memberNumber}` : ''}
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
            <QueryError
              error={history.error}
              onRetry={() => void history.refetch()}
              message='No se pudo cargar el historial.'
            />
          ) : history.data && history.data.appointments.length > 0 ? (
            <>
              <ul className='flex flex-col gap-2 md:hidden'>
                {history.data.appointments.map((appointment) => (
                  <li key={appointment.id} className='rounded-lg border p-3'>
                    <div className='flex flex-wrap items-center justify-between gap-2'>
                      <span className='font-medium tabular-nums'>
                        {appointment.localDate} {appointment.localTime}
                      </span>
                      <StatusBadge status={appointment.status} />
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      {appointment.doctor.name} · {appointment.service.name} ·{' '}
                      {coverageLabel(appointment.coverage)}
                    </div>
                  </li>
                ))}
              </ul>
              <Table className='hidden md:table'>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Cobertura</TableHead>
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
                      <TableCell>{coverageLabel(appointment.coverage)}</TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
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
