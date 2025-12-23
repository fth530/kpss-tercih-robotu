import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type SearchInput, type SearchResponse, type MetaResponse } from "@shared/routes";

// GET /api/meta - Fetch cities, education levels, and qualifications
export function useKpssMeta() {
  return useQuery({
    queryKey: [api.meta.get.path],
    queryFn: async () => {
      const res = await fetch(api.meta.get.path);
      if (!res.ok) throw new Error("Failed to fetch metadata");
      return api.meta.get.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 60, // 1 hour (metadata doesn't change often)
  });
}

// POST /api/positions/search - Search for positions
export function useSearchPositions() {
  return useMutation({
    mutationFn: async (data: SearchInput) => {
      // Validate input before sending using the shared Zod schema
      const validated = api.positions.search.input.parse(data);
      
      const res = await fetch(api.positions.search.path, {
        method: api.positions.search.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Geçersiz arama kriterleri");
        }
        throw new Error("Arama sırasında bir hata oluştu");
      }

      return api.positions.search.responses[200].parse(await res.json());
    },
  });
}
