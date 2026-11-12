import type { Coverage } from './api/types';

/** "OSDE N° 123", "PAMI" o "Particular". */
export function coverageLabel(coverage: Coverage) {
  if (!coverage) return 'Particular';
  return coverage.memberNumber ? `${coverage.name} N° ${coverage.memberNumber}` : coverage.name;
}
