import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '../constants';
import type { AppointmentStatus } from '../api/types';

const VARIANTS: Record<AppointmentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  confirmed: 'default',
  cancelled: 'destructive',
  attended: 'outline',
  no_show: 'destructive'
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
