import { queryOptions } from '@tanstack/react-query';
import { getConfigDoctors, getSpecialties } from './service';

export const configKeys = {
  all: ['clinic-config'] as const,
  specialties: () => [...configKeys.all, 'specialties'] as const,
  doctors: () => [...configKeys.all, 'doctors'] as const
};

export const specialtiesQueryOptions = () =>
  queryOptions({ queryKey: configKeys.specialties(), queryFn: getSpecialties });

export const configDoctorsQueryOptions = () =>
  queryOptions({ queryKey: configKeys.doctors(), queryFn: getConfigDoctors });
