'use client';

import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryState } from 'nuqs';
import PageContainer from '@/components/layout/page-container';
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { meQueryOptions } from '@/features/account/api/queries';
import { ClinicInfoTab } from './clinic-info-tab';
import { DoctorsTab } from './doctors-tab';
import { SpecialtiesTab } from './specialties-tab';

export function ConfigPage() {
  const me = useQuery(meQueryOptions());
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('medicos'));
  const canManage = me.data?.canManageTeam === true;

  return (
    <PageContainer pageTitle='Configuración'>
      {me.isLoading ? (
        <Skeleton className='h-40 w-full' />
      ) : !canManage ? (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyTitle>No tenés permiso para ver esta sección</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ) : (
        <Tabs value={tab} onValueChange={(value) => void setTab(String(value))}>
          <TabsList>
            <TabsTrigger value='medicos'>Médicos</TabsTrigger>
            <TabsTrigger value='especialidades'>Especialidades</TabsTrigger>
            <TabsTrigger value='centro'>Centro</TabsTrigger>
          </TabsList>
          <TabsContent value='medicos' className='pt-4'>
            <DoctorsTab />
          </TabsContent>
          <TabsContent value='especialidades' className='pt-4'>
            <SpecialtiesTab />
          </TabsContent>
          <TabsContent value='centro' className='pt-4'>
            <ClinicInfoTab />
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  );
}
