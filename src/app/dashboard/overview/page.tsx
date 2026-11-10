import PageContainer from '@/components/layout/page-container';
import { Overview } from '@/features/overview/components/overview';

export const metadata = {
  title: 'Inicio'
};

export default function OverviewPage() {
  return (
    <PageContainer pageTitle='Inicio' pageDescription='Turnos de hoy y accesos rápidos.'>
      <Overview />
    </PageContainer>
  );
}
