export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';

export type Appointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  localDate: string;
  localTime: string;
  status: AppointmentStatus;
  source: string;
  notes: string | null;
  patient: { id: string; name: string; phone: string; dni: string | null };
  doctor: { id: string; name: string };
  service: { id: string; name: string; durationMin: number };
};

export type AppointmentFilters = {
  from: string;
  to: string;
  doctorId?: string | null;
  status?: string | null;
};

export type DoctorOption = { id: string; name: string };

export type Patient = {
  id: string;
  name: string;
  phone: string;
  dni: string | null;
};

export type PatientHistory = {
  patient: Patient;
  appointments: Appointment[];
};

export type TimeOff = {
  id: string;
  doctorId: string;
  doctorName: string;
  startsAt: string;
  endsAt: string;
  localStartDate: string;
  localStartTime: string;
  localEndDate: string;
  localEndTime: string;
  reason: string | null;
};

export type CreateTimeOffPayload = {
  doctorId: string;
  startsAt: string;
  endsAt: string;
  reason?: string;
};
