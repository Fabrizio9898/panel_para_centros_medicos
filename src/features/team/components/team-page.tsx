'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { meQueryOptions } from '@/features/account/api/queries';
import { InviteDialog } from './invite-dialog';
import { TeamBoard } from './team-board';

export function TeamPage() {
  const me = useQuery(meQueryOptions());
  const [open, setOpen] = useState(false);
  const canManage = me.data?.canManageTeam === true;

  return (
    <PageContainer
      pageTitle='Equipo'
      pageHeaderAction={
        canManage ? (
          <Button onClick={() => setOpen(true)}>
            <Icons.userPlus className='mr-2 h-4 w-4' /> Invitar
          </Button>
        ) : undefined
      }
    >
      {me.isLoading ? (
        <Skeleton className='h-40 w-full' />
      ) : canManage ? (
        <>
          <TeamBoard />
          <InviteDialog open={open} onOpenChange={setOpen} />
        </>
      ) : (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>No tenés permiso para ver esta sección</EmptyTitle>
          </EmptyHeader>
        </Empty>
      )}
    </PageContainer>
  );
}
