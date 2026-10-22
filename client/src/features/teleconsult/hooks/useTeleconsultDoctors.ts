import { useQuery } from "@tanstack/react-query";
import { teleconsultApi } from "../api/teleconsult.api";

export function useTeleconsultDoctors(specialization?: string) {
  const query = useQuery({
    queryKey: ["teleconsultDoctors", specialization],
    queryFn: () => teleconsultApi.getDoctors(specialization),
    staleTime: 1000 * 60 * 2,
  });

  return {
    doctors: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
