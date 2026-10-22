import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorApi } from "../api/doctor.api";

export function useDoctorAppointments(doctorId?: string) {
  const queryClient = useQueryClient();

  const appointmentsQuery = useQuery({
    queryKey: ["doctorAppointments", doctorId],
    queryFn: () => doctorApi.getAppointments(doctorId),
    staleTime: 1000 * 30,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, prescription }: { id: string; status: "confirmed" | "cancelled" | "completed"; prescription?: string }) =>
      doctorApi.updateAppointmentStatus(id, status, prescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorAppointments"] });
    },
  });

  return {
    appointments: appointmentsQuery.data || [],
    isLoading: appointmentsQuery.isLoading,
    isError: appointmentsQuery.isError,
    error: appointmentsQuery.error,
    refetch: appointmentsQuery.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
