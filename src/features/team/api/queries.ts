import { queryOptions } from '@tanstack/react-query';
import { getTeam } from './service';

export const teamKeys = {
  all: ['team'] as const
};

export const teamQueryOptions = () =>
  queryOptions({
    queryKey: teamKeys.all,
    queryFn: getTeam
  });
