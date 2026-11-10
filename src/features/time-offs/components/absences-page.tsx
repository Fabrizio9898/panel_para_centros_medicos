'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClosuresBoard } from './closures-board';
import { TimeOffsBoard } from './time-offs-board';

export function AbsencesTabs() {
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('medicos'));
  return (
    <Tabs value={tab} onValueChange={(value) => void setTab(String(value))}>
      <TabsList>
        <TabsTrigger value='medicos'>Médicos</TabsTrigger>
        <TabsTrigger value='centro'>Feriados del centro</TabsTrigger>
      </TabsList>
      <TabsContent value='medicos' className='pt-4'>
        <TimeOffsBoard />
      </TabsContent>
      <TabsContent value='centro' className='pt-4'>
        <ClosuresBoard />
      </TabsContent>
    </Tabs>
  );
}
