'use client';

import { useQuery } from '@tanstack/react-query';
import { parseAsString, useQueryState } from 'nuqs';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { meQueryOptions } from '@/features/account/api/queries';
import { CoverageReportTab } from './coverage-report-tab';
import { InsuranceListTab } from './insurance-list-tab';

export function HealthInsurancesPage() {
  const me = useQuery(meQueryOptions());
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('resumen'));

  return (
    <PageContainer
      pageTitle='Obras sociales'
      pageDescription='Turnos atendidos por obra social en el mes y obras sociales con las que trabaja el centro.'
    >
      <Tabs value={tab} onValueChange={(value) => void setTab(String(value))}>
        <TabsList>
          <TabsTrigger value='resumen'>Resumen del mes</TabsTrigger>
          <TabsTrigger value='listado'>Obras sociales</TabsTrigger>
        </TabsList>
        <TabsContent value='resumen' className='pt-4'>
          <CoverageReportTab />
        </TabsContent>
        <TabsContent value='listado' className='pt-4'>
          <InsuranceListTab canManage={me.data?.canManageTeam === true} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
