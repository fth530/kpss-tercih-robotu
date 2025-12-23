import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type SearchInput, type SearchResponse, type MetaResponse } from "@shared/routes";

// GET /api/meta
export function useKpssMeta() {
  return useQuery({
    queryKey: [api.meta.get.path],
    queryFn: async () => {
      const res = await fetch(api.meta.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Metadata fetching failed");
      return api.meta.get.responses[200].parse(await res.json());
    },
    staleTime: 1000 * 60 * 30, // 30 minutes cache for metadata
  });
}

// POST /api/positions/search
export function useSearchPositions() {
  return useMutation({
    mutationFn: async (data: SearchInput) => {
      const validated = api.positions.search.input.parse(data);
      const res = await fetch(api.positions.search.path, {
        method: api.positions.search.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          throw new Error("Lütfen arama kriterlerinizi kontrol ediniz.");
        }
        throw new Error("Arama işlemi başarısız oldu.");
      }

      return api.positions.search.responses[200].parse(await res.json());
    },
  });
}
