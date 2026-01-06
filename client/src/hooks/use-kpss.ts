import { useQuery, useMutation } from "@tanstack/react-query";
import type {
  Qualification,
  PositionWithQualifications,
  FilterDataResponse,
  SearchPositionsResponse,
} from "@shared/schema";

// Local type for raw position data from JSON
interface RawPosition {
  osymCode: string;
  institution: string;
  title: string;
  city: string;
  quota: number;
  qualificationCodes: string[];
  educationLevel: string;
}

// Cache for loaded data
let cachedQualifications: Qualification[] | null = null;
let cachedPositions: RawPosition[] | null = null;

async function loadData() {
  if (!cachedQualifications || !cachedPositions) {
    const [qualsRes, posRes] = await Promise.all([
      fetch('/data/qualifications.json'),
      fetch('/data/positions.json')
    ]);

    if (!qualsRes.ok || !posRes.ok) {
      throw new Error("Veri dosyaları yüklenemedi");
    }

    cachedQualifications = await qualsRes.json();
    cachedPositions = await posRes.json();
  }

  return { qualifications: cachedQualifications!, positions: cachedPositions! };
}

// GET meta data from static JSON
export function useKpssMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: async (): Promise<FilterDataResponse> => {
      const { qualifications, positions } = await loadData();

      const cities = Array.from(new Set(positions.map(p => p.city))).sort();
      const educationLevels = Array.from(new Set(positions.map(p => p.educationLevel))).sort();

      return {
        cities,
        educationLevels,
        qualifications
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

interface SearchInput {
  educationLevel: string;
  cities: string[];
  departmentCodes: string[];
  page?: number;
  limit?: number;
}

// Search positions from static JSON with pagination
export function useSearchPositions() {
  return useMutation({
    mutationFn: async (data: SearchInput): Promise<SearchPositionsResponse> => {
      const { qualifications, positions } = await loadData();
      const { educationLevel, cities, departmentCodes, page = 1, limit = 50 } = data;

      let results = positions;

      // Filter by education level
      if (educationLevel) {
        results = results.filter(p => p.educationLevel === educationLevel);
      }

      // Filter by cities
      const hasAllCities = cities?.some(c =>
        c.toLowerCase() === 'all' || c === 'Tümü' || c === 'Tüm Şehirler'
      );
      if (!hasAllCities && cities?.length > 0) {
        results = results.filter(p => cities.includes(p.city));
      }

      // Filter by qualification codes
      if (departmentCodes && departmentCodes.length > 0) {
        const hasAllDepts = departmentCodes.some(c =>
          c.toLowerCase() === 'all' || c === 'Tümü'
        );

        if (!hasAllDepts) {
          let codesToSearch = [...departmentCodes];

          if (educationLevel === "Ortaöğretim" && !codesToSearch.includes("2001")) {
            codesToSearch.push("2001");
          }
          if (educationLevel === "Önlisans" && !codesToSearch.includes("3001")) {
            codesToSearch.push("3001");
          }
          if (educationLevel === "Lisans" && !codesToSearch.includes("4001")) {
            codesToSearch.push("4001");
          }

          results = results.filter(p =>
            p.qualificationCodes.some(qc => codesToSearch.includes(qc))
          );
        }
      }

      // Pagination
      const total = results.length;
      const start = (page - 1) * limit;
      const paginatedResults = results.slice(start, start + limit);

      // Map to response format
      const qualMap = new Map(qualifications.map(q => [q.code, q]));

      const responseData = paginatedResults.map((p, idx) => ({
        id: idx + 1 + start,
        osymCode: p.osymCode,
        institution: p.institution,
        title: p.title,
        city: p.city,
        quota: p.quota,
        educationLevel: p.educationLevel,
        minScore: null,
        qualifications: p.qualificationCodes
          .map(code => qualMap.get(code))
          .filter((q): q is Qualification => q !== undefined)
      }));

      return {
        data: responseData,
        total,
        page,
        limit
      };
    },
  });
}
