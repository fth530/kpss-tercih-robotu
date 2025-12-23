import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type SearchInput, type SearchResponse, type MetaResponse } from "@shared/routes";

export function useKpssMeta() {
  return useQuery<MetaResponse>({
    queryKey: [api.meta.get.path],
    queryFn: async () => {
      const res = await fetch(api.meta.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch metadata");
      return api.meta.get.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useSearchPositions() {
  return useMutation<SearchResponse, Error, SearchInput>({
    mutationFn: async (data) => {
      // Basic validation handled by Zod on backend, but good to check here too
      if (data.cities.length === 0) {
        throw new Error("Lütfen en az bir şehir seçiniz.");
      }
      
      const res = await fetch(api.positions.search.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Geçersiz arama kriterleri");
        }
        throw new Error("Arama yapılırken bir hata oluştu");
      }

      return api.positions.search.responses[200].parse(await res.json());
    },
  });
}
