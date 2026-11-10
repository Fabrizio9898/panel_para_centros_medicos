import PageContainer from '@/components/layout/page-container';
import { TimeOffsBoard } from '@/features/time-offs/components/time-offs-board';

export const metadata = {
  title: 'Ausencias'
};

export default function AusenciasPage() {
  return (
    <PageContainer
      pageTitle='Ausencias'
      pageDescription='Vacaciones o días en los que un médico no atiende.'
    >
      <TimeOffsBoard />
    </PageContainer>
  );
}
