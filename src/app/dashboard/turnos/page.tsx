import PageContainer from '@/components/layout/page-container';
import { AppointmentsBoard } from '@/features/appointments/components/appointments-board';

export const metadata = {
  title: 'Turnos'
};

export default function TurnosPage() {
  return (
    <PageContainer
      pageTitle='Turnos'
      pageDescription='Mirá los turnos del día o de la semana y marcá qué pasó con cada uno.'
    >
      <AppointmentsBoard />
    </PageContainer>
  );
}
