export type HealthInsurance = { id: string; name: string; active: boolean };

/** Cobertura de un paciente o de un turno. `null` = particular. */
export type Coverage = {
  healthInsuranceId: string;
  name: string;
  memberNumber: string | null;
} | null;

export type CoverageReportRow = {
  id: string;
  localDate: string;
  localTime: string;
  /** null = particular. */
  healthInsuranceId: string | null;
  healthInsuranceName: string;
  memberNumber: string | null;
  patientName: string;
  patientDni: string | null;
  doctorName: string;
  serviceName: string;
};

export type CoverageReport = {
  from: string;
  to: string;
  total: number;
  byInsurance: { healthInsuranceId: string | null; name: string; count: number }[];
  appointments: CoverageReportRow[];
};
