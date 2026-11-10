'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { meQueryOptions } from '@/features/account/api/queries';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { isApiError } from '@/lib/api-client';

interface QueryErrorProps {
  error: unknown;
  onRetry: () => void;
  /** Texto cuando falla la carga (no aplica a 403). */
  message: string;
}

/** Cuenta de Clerk sin clínica vinculada (el backend responde 403). */
export function PendingActivation() {
  return (
    <Empty className='border'>
      <EmptyHeader>
        <EmptyTitle>Cuenta pendiente de activación</EmptyTitle>
        <EmptyDescription>Todavía no hay una clínica asociada a tu usuario.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function NoPermission() {
  return (
    <Empty className='border'>
      <EmptyHeader>
        <EmptyTitle>No tenés permiso para ver esto</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}

export function QueryError({ error, onRetry, message }: QueryErrorProps) {
  const me = useQuery(meQueryOptions());
  const forbidden = isApiError(error) && error.status === 403;
  const [verified, setVerified] = useState(false);
  const { refetch } = me;

  useEffect(() => {
    if (!forbidden) return;
    let active = true;
    void refetch().finally(() => {
      if (active) setVerified(true);
    });
    return () => {
      active = false;
    };
  }, [forbidden, refetch]);

  if (forbidden) {
    if (!verified) return <Skeleton className='h-32 w-full' />;
    return me.data?.role ? <NoPermission /> : <PendingActivation />;
  }

  const retryable = !isApiError(error) || error.status >= 500;

  return (
    <div className='flex flex-col items-center gap-3 rounded-lg border p-8 text-center'>
      <p className='text-muted-foreground text-sm'>{message}</p>
      {retryable && (
        <Button variant='outline' size='sm' onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
