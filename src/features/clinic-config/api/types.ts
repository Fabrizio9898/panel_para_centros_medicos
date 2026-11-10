export type Specialty = { id: string; name: string; doctorCount: number };

export type ConfigService = { id: string; name: string; durationMin: number; active: boolean };

/** dayOfWeek: 0 = domingo … 6 = sábado. Horas "HH:mm" en hora de la clínica. */
export type ScheduleRule = { dayOfWeek: number; startTime: string; endTime: string };

export type ConfigDoctor = {
  id: string;
  name: string;
  active: boolean;
  requiresDni: boolean;
  specialtyIds: string[];
  services: ConfigService[];
  schedule: ScheduleRule[];
};

export type DoctorPayload = {
  name?: string;
  specialtyIds?: string[];
  requiresDni?: boolean;
  active?: boolean;
};

export type ServicePayload = { name?: string; durationMin?: number; active?: boolean };

export type ScheduleResult = { schedule: ScheduleRule[]; appointmentsOutsideHours: number };

export type ClinicInfo = { name: string; address: string | null; phone: string | null };

export type ClinicInfoPayload = { name: string; address: string; phone: string };
