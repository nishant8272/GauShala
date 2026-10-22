import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorApi } from "../api/doctor.api";
import type { DocType } from "../types/doctor.types";

export function useDoctorProfile(userId?: string) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["doctorProfile", userId],
    queryFn: () => doctorApi.getProfile(userId),
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const onboardMutation = useMutation({
    mutationFn: (payload: any) => doctorApi.onboard(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: ({ documentType, fileData }: { documentType: DocType; fileData: { fileName: string; mimeType: string; fileBase64: string } }) =>
      doctorApi.uploadDocument(documentType, fileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: () => doctorApi.completeOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: (isAvailable: boolean) => doctorApi.toggleAvailability(isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    onboard: onboardMutation.mutateAsync,
    isOnboarding: onboardMutation.isPending,
    uploadDocument: uploadDocMutation.mutateAsync,
    isUploadingDoc: uploadDocMutation.isPending,
    completeOnboarding: completeOnboardingMutation.mutateAsync,
    isCompleting: completeOnboardingMutation.isPending,
    toggleAvailability: toggleAvailabilityMutation.mutateAsync,
    isTogglingAvailability: toggleAvailabilityMutation.isPending,
  };
}
