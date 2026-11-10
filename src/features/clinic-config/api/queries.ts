import { queryOptions } from '@tanstack/react-query';
import { getClinicInfo, getConfigDoctors, getSpecialties } from './service';

export const configKeys = {
  all: ['clinic-config'] as const,
  specialties: () => [...configKeys.all, 'specialties'] as const,
  doctors: () => [...configKeys.all, 'doctors'] as const,
  clinic: () => [...configKeys.all, 'clinic'] as const
};

export const specialtiesQueryOptions = () =>
  queryOptions({ queryKey: configKeys.specialties(), queryFn: getSpecialties });

export const configDoctorsQueryOptions = () =>
  queryOptions({ queryKey: configKeys.doctors(), queryFn: getConfigDoctors });

export const clinicInfoQueryOptions = () =>
  queryOptions({ queryKey: configKeys.clinic(), queryFn: getClinicInfo });
