import { queryOptions } from '@tanstack/react-query';
import { getMe } from './service';

export const meKeys = {
  all: ['me'] as const
};

export const meQueryOptions = () =>
  queryOptions({
    queryKey: meKeys.all,
    queryFn: getMe,
    staleTime: 5 * 60 * 1000
  });
