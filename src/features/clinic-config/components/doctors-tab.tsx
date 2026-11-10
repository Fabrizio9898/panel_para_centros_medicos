'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryError } from '@/components/feedback/query-error';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { configDoctorsQueryOptions, specialtiesQueryOptions } from '../api/queries';
import { DoctorSheet } from './doctor-sheet';
import { scheduleSummary } from './schedule-editor';

export function DoctorsTab() {
  const doctors = useQuery(configDoctorsQueryOptions());
  const specialties = useQuery(specialtiesQueryOptions());
  const [openId, setOpenId] = useState<string | null>(null);

  const specialtyName = new Map((specialties.data ?? []).map((s) => [s.id, s.name]));
  const rows = doctors.data ?? [];

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setOpenId('new')}>
          <Icons.add className='mr-1 h-4 w-4' /> Nuevo médico
        </Button>
      </div>

      {doctors.isLoading ? (
        <div className='space-y-2 rounded-lg border p-4'>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className='h-10 w-full' />
          ))}
        </div>
      ) : doctors.isError ? (
        <QueryError
          error={doctors.error}
          onRetry={() => void doctors.refetch()}
          message='No se pudieron cargar los médicos.'
        />
      ) : rows.length === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Todavía no hay médicos</EmptyTitle>
          </EmptyHeader>
          <Button onClick={() => setOpenId('new')}>
            <Icons.add className='mr-1 h-4 w-4' /> Cargar el primero
          </Button>
        </Empty>
      ) : (
        <div className='overflow-x-auto rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Médico</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead className='w-24' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((doctor) => {
                const activeServices = doctor.services.filter((s) => s.active);
                return (
                  <TableRow key={doctor.id} className={doctor.active ? '' : 'opacity-60'}>
                    <TableCell className='font-medium'>
                      {doctor.name}
                      {!doctor.active && (
                        <Badge variant='secondary' className='ml-2'>
                          Inactivo
                        </Badge>
                      )}
                      {doctor.requiresDni && (
                        <Badge variant='outline' className='ml-2'>
                          Pide DNI
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {doctor.specialtyIds
                        .map((id) => specialtyName.get(id))
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </TableCell>
                    <TableCell>
                      {activeServices.length === 0 ? (
                        <span className='text-destructive text-sm'>Sin servicios</span>
                      ) : (
                        activeServices.map((s) => `${s.name} (${s.durationMin}')`).join(', ')
                      )}
                    </TableCell>
                    <TableCell className='max-w-[260px] text-sm'>
                      {doctor.schedule.length === 0 ? (
                        <span className='text-destructive'>Sin horario</span>
                      ) : (
                        scheduleSummary(doctor.schedule)
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button variant='outline' size='sm' onClick={() => setOpenId(doctor.id)}>
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <DoctorSheet doctorId={openId} onDoctorIdChange={setOpenId} />
    </div>
  );
}
