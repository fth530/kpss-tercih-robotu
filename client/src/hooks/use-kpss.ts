import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type {
  FilterDataResponse,
  SearchPositionsRequest,
  SearchPositionsResponse
} from "@shared/schema";

// GET meta data from API
export function useKpssMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: async (): Promise<FilterDataResponse> => {
      const res = await apiRequest("GET", "/api/meta");
      return await res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

// Search positions via API
export function useSearchPositions() {
  return useMutation({
    mutationFn: async (data: SearchPositionsRequest): Promise<SearchPositionsResponse> => {
      const res = await apiRequest("POST", "/api/positions/search", data);
      return await res.json();
    },
  });
}
