import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin.api";

export function useAdminDoctors(statusFilter?: string) {
  const queryClient = useQueryClient();

  const doctorsQuery = useQuery({
    queryKey: ["adminDoctors", statusFilter],
    queryFn: () => adminApi.listDoctors(statusFilter),
    staleTime: 1000 * 30,
  });

  const approveMutation = useMutation({
    mutationFn: (profileId: string) => adminApi.approveDoctor(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDoctors"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ profileId, reason }: { profileId: string; reason: string }) =>
      adminApi.rejectDoctor(profileId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDoctors"] });
    },
  });

  return {
    doctors: doctorsQuery.data || [],
    isLoading: doctorsQuery.isLoading,
    isError: doctorsQuery.isError,
    error: doctorsQuery.error,
    refetch: doctorsQuery.refetch,
    approveDoctor: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    rejectDoctor: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
  };
}
