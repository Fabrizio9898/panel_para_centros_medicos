'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryError } from '@/components/feedback/query-error';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { todayLocal } from '@/features/appointments/date-utils';
import { coverageReportQueryOptions } from '../api/queries';
import type { CoverageReport, CoverageReportRow } from '../api/types';

/** "2026-11" → primer y último día del mes. */
function monthRange(month: string) {
  const [year, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  const [year, m] = month.split('-').map(Number);
  const label = new Date(Date.UTC(year, m - 1, 15)).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** `null` en el filtro = particular; `undefined` = todas. */
type Filter = string | null | undefined;

function csvCell(value: string | null) {
  const text = value ?? '';
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV con ";" y BOM: Excel en español lo abre bien con doble clic. */
function downloadCsv(rows: CoverageReportRow[], fileName: string) {
  const header = [
    'Fecha',
    'Hora',
    'Obra social',
    'N° de afiliado',
    'Paciente',
    'DNI',
    'Médico',
    'Servicio'
  ];
  const lines = rows.map((r) =>
    [
      r.localDate,
      r.localTime,
      r.healthInsuranceName,
      r.memberNumber,
      r.patientName,
      r.patientDni,
      r.doctorName,
      r.serviceName
    ]
      .map(csvCell)
      .join(';')
  );
  const blob = new Blob([`﻿${[header.join(';'), ...lines].join('\r\n')}`], {
    type: 'text/csv;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function filterRows(report: CoverageReport | undefined, filter: Filter) {
  const rows = report?.appointments ?? [];
  if (filter === undefined) return rows;
  return rows.filter((r) => r.healthInsuranceId === filter);
}

export function CoverageReportTab() {
  const [month, setMonth] = useState(() => todayLocal().slice(0, 7));
  const [filter, setFilter] = useState<Filter>(undefined);
  const { from, to } = monthRange(month);
  const report = useQuery(coverageReportQueryOptions(from, to));
  const rows = filterRows(report.data, filter);
  const filterName =
    filter === undefined
      ? null
      : report.data?.byInsurance.find((t) => t.healthInsuranceId === filter)?.name;

  const changeMonth = (delta: number) => {
    setMonth((current) => shiftMonth(current, delta));
    setFilter(undefined);
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon'
            aria-label='Mes anterior'
            onClick={() => changeMonth(-1)}
          >
            <Icons.chevronLeft />
          </Button>
          <span className='min-w-36 text-center font-medium'>{monthLabel(month)}</span>
          <Button
            variant='outline'
            size='icon'
            aria-label='Mes siguiente'
            onClick={() => changeMonth(1)}
          >
            <Icons.chevronRight />
          </Button>
        </div>
        <Button
          variant='outline'
          className='sm:ml-auto'
          disabled={rows.length === 0}
          onClick={() =>
            downloadCsv(
              rows,
              `turnos-atendidos-${month}${filterName ? `-${filterName.replace(/\s+/g, '-')}` : ''}.csv`
            )
          }
        >
          <Icons.download className='mr-1 h-4 w-4' /> Descargar Excel
        </Button>
      </div>

      {report.isLoading ? (
        <div className='space-y-2'>
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-40 w-full' />
        </div>
      ) : report.isError ? (
        <QueryError
          error={report.error}
          onRetry={() => void report.refetch()}
          message='No se pudo cargar el resumen.'
        />
      ) : !report.data || report.data.total === 0 ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>Sin turnos atendidos en {monthLabel(month).toLowerCase()}</EmptyTitle>
            <EmptyDescription>
              Acá aparecen los turnos marcados como &quot;Asistió&quot; en Turnos.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cobertura</TableHead>
                  <TableHead className='text-right'>Turnos atendidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.data.byInsurance.map((total) => {
                  const selected = filter === total.healthInsuranceId;
                  return (
                    <TableRow
                      key={total.healthInsuranceId ?? 'particular'}
                      className={cn('cursor-pointer', selected && 'bg-muted')}
                      onClick={() => setFilter(selected ? undefined : total.healthInsuranceId)}
                    >
                      <TableCell className='font-medium'>
                        <button
                          type='button'
                          className='text-left hover:underline'
                          aria-pressed={selected}
                        >
                          {total.name}
                        </button>
                      </TableCell>
                      <TableCell className='text-right tabular-nums'>{total.count}</TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className='font-medium'>Total</TableCell>
                  <TableCell className='text-right font-medium tabular-nums'>
                    {report.data.total}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className='flex flex-wrap items-center justify-between gap-2'>
            <h3 className='font-medium'>
              {filterName ? `Detalle: ${filterName}` : 'Detalle de todos los turnos'}
            </h3>
            {filterName && (
              <Button variant='ghost' size='sm' onClick={() => setFilter(undefined)}>
                Ver todos
              </Button>
            )}
          </div>

          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Obra social</TableHead>
                  <TableHead>N° de afiliado</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Servicio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className='whitespace-nowrap tabular-nums'>
                      {row.localDate} {row.localTime}
                    </TableCell>
                    <TableCell>
                      <div className='font-medium'>{row.patientName}</div>
                      {row.patientDni && (
                        <div className='text-muted-foreground text-xs'>DNI {row.patientDni}</div>
                      )}
                    </TableCell>
                    <TableCell>{row.healthInsuranceName}</TableCell>
                    <TableCell>{row.memberNumber ?? '—'}</TableCell>
                    <TableCell>{row.doctorName}</TableCell>
                    <TableCell>{row.serviceName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
