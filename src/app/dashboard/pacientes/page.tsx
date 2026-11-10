import PageContainer from '@/components/layout/page-container';
import { PatientSearch } from '@/features/patients/components/patient-search';

export const metadata = {
  title: 'Pacientes'
};

export default function PacientesPage() {
  return (
    <PageContainer
      pageTitle='Pacientes'
      pageDescription='Buscá por nombre, teléfono o DNI y mirá el historial de turnos.'
    >
      <PatientSearch />
    </PageContainer>
  );
}
