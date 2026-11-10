'use client';

import { Button } from '@/components/ui/button';
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

export function QueryError({ error, onRetry, message }: QueryErrorProps) {
  if (isApiError(error) && error.status === 403) return <PendingActivation />;

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
