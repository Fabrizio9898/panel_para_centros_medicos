import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getCoverageReport, getHealthInsurances } from './service';

export const insuranceKeys = {
  all: ['health-insurances'] as const,
  list: () => [...insuranceKeys.all, 'list'] as const,
  report: (from: string, to: string) => [...insuranceKeys.all, 'report', from, to] as const
};

export const healthInsurancesQueryOptions = () =>
  queryOptions({ queryKey: insuranceKeys.list(), queryFn: getHealthInsurances });

export const coverageReportQueryOptions = (from: string, to: string) =>
  queryOptions({
    queryKey: insuranceKeys.report(from, to),
    queryFn: () => getCoverageReport(from, to),
    placeholderData: keepPreviousData
  });
