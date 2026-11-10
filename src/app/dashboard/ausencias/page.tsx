import PageContainer from '@/components/layout/page-container';
import { AbsencesTabs } from '@/features/time-offs/components/absences-page';

export const metadata = {
  title: 'Ausencias'
};

export default function AusenciasPage() {
  return (
    <PageContainer pageTitle='Ausencias'>
      <AbsencesTabs />
    </PageContainer>
  );
}
