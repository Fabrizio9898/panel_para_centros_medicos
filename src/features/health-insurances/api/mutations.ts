import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isApiError } from '@/lib/api-client';
import { patientKeys } from '@/features/appointments/api/queries';
import { insuranceKeys } from './queries';
import { createHealthInsurance, updateHealthInsurance } from './service';

function message(error: unknown, fallback: string) {
  if (isApiError(error) && [400, 404, 409].includes(error.status)) return error.message;
  return fallback;
}

export function useSaveHealthInsurance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name, active }: { id?: string; name?: string; active?: boolean }) =>
      id ? updateHealthInsurance(id, { name, active }) : createHealthInsurance(name ?? ''),
    onSuccess: (saved, { id, active }) => {
      void queryClient.invalidateQueries({ queryKey: insuranceKeys.all });
      // El nombre aparece en la lista de pacientes.
      void queryClient.invalidateQueries({ queryKey: patientKeys.all });
      if (!id) toast.success(`${saved.name} agregada`);
      else if (active !== undefined)
        toast.success(saved.active ? `${saved.name} activada` : `${saved.name} dada de baja`);
      else toast.success('Obra social actualizada');
    },
    onError: (error) => toast.error(message(error, 'No se pudo guardar la obra social'))
  });
}
